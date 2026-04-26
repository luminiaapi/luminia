# GitHub Issue Templates

This directory contains issue templates for the Lumina project.

## Available Templates

### 🐛 Bug Report (`bug_report.yml`)

Use this template to report bugs or unexpected behavior in Lumina.

**Includes:**
- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots
- System information (OS, version)
- Server type (local/remote)
- Error logs
- Additional context

### ✨ Feature Request (`feature_request.yml`)

Use this template to suggest new features or enhancements.

**Includes:**
- Problem statement
- Proposed solution
- Alternatives considered
- Feature area (collections, auth, UI, etc.)
- Priority level
- Use case description
- Mockups/examples
- Technical details
- Breaking change indicator

### ⚙️ Configuration (`config.yml`)

Configures the issue template chooser and provides links to:
- Discussions
- Documentation
- Ideas & Feedback

## Template Features

### Form-Based Templates

Both templates use GitHub's YAML-based form syntax, which provides:

- **Structured input** - Dropdown menus, checkboxes, text areas
- **Validation** - Required fields ensure complete information
- **Auto-labeling** - Issues are automatically tagged
- **Better UX** - Guided form instead of markdown template

### Auto-Labels

Issues created from templates are automatically labeled:

- Bug reports: `bug`, `needs-triage`
- Feature requests: `enhancement`, `needs-triage`

### Required Information

Templates enforce required fields to ensure:
- Complete bug reports with reproduction steps
- Well-defined feature requests with use cases
- Proper context for maintainers

## Usage

### For Users

1. Go to the [Issues](https://github.com/YOUR_USERNAME/lumina/issues) page
2. Click "New Issue"
3. Choose a template:
   - 🐛 Bug Report
   - ✨ Feature Request
4. Fill out the form
5. Submit

### For Maintainers

**Customizing Templates:**

1. Edit `.github/ISSUE_TEMPLATE/bug_report.yml` or `feature_request.yml`
2. Modify fields, labels, or validation rules
3. Commit changes

**Adding New Templates:**

1. Create a new `.yml` file in `.github/ISSUE_TEMPLATE/`
2. Follow the [GitHub documentation](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
3. Add to `config.yml` if needed

## Template Syntax

### Basic Structure

```yaml
name: Template Name
description: Template description
title: "[Prefix]: "
labels: ["label1", "label2"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Markdown content here

  - type: textarea
    id: field_id
    attributes:
      label: Field Label
      description: Field description
      placeholder: Placeholder text
    validations:
      required: true
```

### Field Types

- `markdown` - Static text/instructions
- `textarea` - Multi-line text input
- `input` - Single-line text input
- `dropdown` - Select menu
- `checkboxes` - Multiple checkboxes

### Validation

```yaml
validations:
  required: true  # Field must be filled
```

## Best Practices

### For Bug Reports

- Include clear reproduction steps
- Provide system information
- Add screenshots when relevant
- Include error logs
- Describe expected behavior

### For Feature Requests

- Explain the problem being solved
- Describe the proposed solution
- Provide use cases
- Consider alternatives
- Add mockups if possible

## Resources

- [GitHub Issue Forms Documentation](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [Issue Form Schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)
- [About Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates)

## Maintenance

Templates should be reviewed and updated:
- When new features are added
- When common issues emerge
- Based on user feedback
- To improve clarity

## Contributing

To improve these templates:

1. Open an issue describing the improvement
2. Submit a PR with changes
3. Update this README if needed

---

**Note:** Remember to update the URLs in `config.yml` with your actual GitHub repository path.
