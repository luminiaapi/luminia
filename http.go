package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// ── Types ─────────────────────────────────────────────────────────────────────

type KVPair struct {
	ID      string `json:"id"`
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type AuthConfig struct {
	Type        string `json:"type"`
	BearerToken string `json:"bearerToken,omitempty"`
	Username    string `json:"username,omitempty"`
	Password    string `json:"password,omitempty"`
	APIKeyName  string `json:"apiKeyName,omitempty"`
	APIKeyValue string `json:"apiKeyValue,omitempty"`
}

type RequestCookie struct {
	Name     string `json:"name"`
	Value    string `json:"value"`
	Domain   string `json:"domain"`
	Path     string `json:"path"`
	Expires  string `json:"expires,omitempty"`
	HTTPOnly bool   `json:"httpOnly"`
	Secure   bool   `json:"secure"`
	Enabled  bool   `json:"enabled"`
}

type ProxySettings struct {
	Enabled bool   `json:"enabled"`
	HTTP    string `json:"http"`
	HTTPS   string `json:"https"`
	SOCKS   string `json:"socks"`
}

type HTTPRequest struct {
	Method         string          `json:"method"`
	URL            string          `json:"url"`
	Headers        []KVPair        `json:"headers"`
	Params         []KVPair        `json:"params"`
	Auth           AuthConfig      `json:"auth"`
	BodyType       string          `json:"bodyType"`
	Body           string          `json:"body"`
	BodyFormData   []KVPair        `json:"bodyFormData"`
	BodyURLEncoded []KVPair        `json:"bodyUrlEncoded"`
	Proxy          ProxySettings   `json:"proxy"`
	Cookies        []RequestCookie `json:"cookies"`
}

type ResponseHeader struct {
	ID    string `json:"id"`
	Key   string `json:"key"`
	Value string `json:"value"`
}

type ResponseCookie struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Value    string `json:"value"`
	Domain   string `json:"domain"`
	Path     string `json:"path"`
	Expires  string `json:"expires,omitempty"`
	HTTPOnly bool   `json:"httpOnly"`
	Secure   bool   `json:"secure"`
}

type HTTPResponse struct {
	Status     int              `json:"status"`
	StatusText string           `json:"statusText"`
	Time       string           `json:"time"`
	Size       string           `json:"size"`
	Headers    []ResponseHeader `json:"headers"`
	Body       string           `json:"body"`
	Cookies    []ResponseCookie `json:"cookies,omitempty"`
	Error      string           `json:"error,omitempty"`
	Cancelled  bool             `json:"cancelled,omitempty"`
}

// ── Cancellation ──────────────────────────────────────────────────────────────

var (
	cancelMu     sync.Mutex
	activeCancel context.CancelFunc
)

// CancelRequest aborts the in-flight request (if any).
func (a *App) CancelRequest() {
	cancelMu.Lock()
	defer cancelMu.Unlock()
	if activeCancel != nil {
		activeCancel()
		activeCancel = nil
	}
}

// ── SendRequest ───────────────────────────────────────────────────────────────

func (a *App) SendRequest(req HTTPRequest) HTTPResponse {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	cancelMu.Lock()
	if activeCancel != nil {
		activeCancel()
	}
	activeCancel = cancel
	cancelMu.Unlock()
	defer func() {
		cancelMu.Lock()
		activeCancel = nil
		cancelMu.Unlock()
		cancel()
	}()

	start := time.Now()

	rawURL := req.URL
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}

	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return HTTPResponse{Error: fmt.Sprintf("Invalid URL: %s", err)}
	}

	q := parsedURL.Query()
	for _, p := range req.Params {
		if p.Enabled && p.Key != "" {
			q.Set(p.Key, p.Value)
		}
	}
	parsedURL.RawQuery = q.Encode()

	var bodyReader io.Reader
	var contentType string

	switch req.BodyType {
	case "json":
		bodyReader = strings.NewReader(req.Body)
		contentType = "application/json"
	case "urlencoded":
		form := url.Values{}
		for _, p := range req.BodyURLEncoded {
			if p.Enabled && p.Key != "" {
				form.Set(p.Key, p.Value)
			}
		}
		bodyReader = strings.NewReader(form.Encode())
		contentType = "application/x-www-form-urlencoded"
	case "form-data":
		var buf bytes.Buffer
		for _, p := range req.BodyFormData {
			if p.Enabled && p.Key != "" {
				buf.WriteString(p.Key + "=" + p.Value + "&")
			}
		}
		bodyReader = &buf
		contentType = "application/x-www-form-urlencoded"
	}

	httpReq, err := http.NewRequestWithContext(ctx, req.Method, parsedURL.String(), bodyReader)
	if err != nil {
		return HTTPResponse{Error: fmt.Sprintf("Failed to create request: %s", err)}
	}

	if contentType != "" {
		httpReq.Header.Set("Content-Type", contentType)
	}
	for _, h := range req.Headers {
		if h.Enabled && h.Key != "" {
			httpReq.Header.Set(h.Key, h.Value)
		}
	}

	// Add cookies as Cookie header
	if len(req.Cookies) > 0 {
		var cookieStrings []string
		for _, c := range req.Cookies {
			if c.Enabled {
				cookieStrings = append(cookieStrings, fmt.Sprintf("%s=%s", c.Name, c.Value))
			}
		}
		if len(cookieStrings) > 0 {
			httpReq.Header.Set("Cookie", strings.Join(cookieStrings, "; "))
		}
	}

	switch req.Auth.Type {
	case "bearer":
		if req.Auth.BearerToken != "" {
			httpReq.Header.Set("Authorization", "Bearer "+req.Auth.BearerToken)
		}
	case "basic":
		if req.Auth.Username != "" {
			creds := base64.StdEncoding.EncodeToString([]byte(req.Auth.Username + ":" + req.Auth.Password))
			httpReq.Header.Set("Authorization", "Basic "+creds)
		}
	case "apikey":
		if req.Auth.APIKeyName != "" {
			httpReq.Header.Set(req.Auth.APIKeyName, req.Auth.APIKeyValue)
		}
	}

	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: false},
	}

	// Configure proxy if enabled
	if req.Proxy.Enabled {
		proxyFunc := func(r *http.Request) (*url.URL, error) {
			scheme := r.URL.Scheme
			var proxyURL string

			// Choose proxy based on request scheme
			if scheme == "https" && req.Proxy.HTTPS != "" {
				proxyURL = req.Proxy.HTTPS
			} else if scheme == "http" && req.Proxy.HTTP != "" {
				proxyURL = req.Proxy.HTTP
			} else if req.Proxy.SOCKS != "" {
				proxyURL = req.Proxy.SOCKS
			}

			if proxyURL != "" {
				return url.Parse(proxyURL)
			}
			return nil, nil
		}
		transport.Proxy = proxyFunc
	}

	client := &http.Client{
		Transport: transport,
		Jar:       nil, // We'll manage cookies manually
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		if ctx.Err() == context.Canceled {
			return HTTPResponse{Cancelled: true, Error: "Request cancelled"}
		}
		return HTTPResponse{Error: fmt.Sprintf("Request failed: %s", err)}
	}
	defer resp.Body.Close()

	elapsed := time.Since(start)

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		if ctx.Err() == context.Canceled {
			return HTTPResponse{Cancelled: true, Error: "Request cancelled"}
		}
		return HTTPResponse{Error: fmt.Sprintf("Failed to read response: %s", err)}
	}

	var respHeaders []ResponseHeader
	i := 1
	for k, vals := range resp.Header {
		respHeaders = append(respHeaders, ResponseHeader{
			ID:    fmt.Sprintf("%d", i),
			Key:   k,
			Value: strings.Join(vals, ", "),
		})
		i++
	}

	// Extract cookies from response
	var respCookies []ResponseCookie
	for idx, cookie := range resp.Cookies() {
		expires := ""
		if !cookie.Expires.IsZero() {
			expires = cookie.Expires.Format(time.RFC3339)
		}
		respCookies = append(respCookies, ResponseCookie{
			ID:       fmt.Sprintf("%d", idx+1),
			Name:     cookie.Name,
			Value:    cookie.Value,
			Domain:   cookie.Domain,
			Path:     cookie.Path,
			Expires:  expires,
			HTTPOnly: cookie.HttpOnly,
			Secure:   cookie.Secure,
		})
	}

	return HTTPResponse{
		Status:     resp.StatusCode,
		StatusText: http.StatusText(resp.StatusCode),
		Time:       formatDuration(elapsed),
		Size:       formatSize(len(bodyBytes)),
		Headers:    respHeaders,
		Body:       string(bodyBytes),
		Cookies:    respCookies,
	}
}

func formatDuration(d time.Duration) string {
	if d < time.Second {
		return fmt.Sprintf("%dms", d.Milliseconds())
	}
	return fmt.Sprintf("%.2fs", d.Seconds())
}

func formatSize(n int) string {
	if n < 1024 {
		return fmt.Sprintf("%dB", n)
	} else if n < 1024*1024 {
		return fmt.Sprintf("%.1fKB", float64(n)/1024)
	}
	return fmt.Sprintf("%.1fMB", float64(n)/(1024*1024))
}
