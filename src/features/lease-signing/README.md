# Lease Signing Feature

This directory contains the modular step components for the lease signing feature.

## Documentation

**All documentation has been moved to `/docs/lease-signing/`**

Please see the following documents for detailed information:

- **[Overview](../../docs/lease-signing/overview.md)** - Feature overview and architecture
- **[Template Workflows](../../docs/lease-signing/template-workflows.md)** - Template creation and editing flows
- **[PDFEditor Integration](../../docs/lease-signing/pdf-editor-integration.md)** - How to properly integrate PDFEditor
- **[Component Reference](../../docs/lease-signing/component-reference.md)** - API documentation for step components
- **[Feature Specification](../../docs/lease-signing/feature-spec.md)** - Requirements and usage examples
- **[Migration Guide](../../docs/lease-signing/migration-guide.md)** - Architecture evolution history

## Quick Start

For implementing new workflows or modifying existing ones:

1. Read [PDFEditor Integration Guide](../../docs/lease-signing/pdf-editor-integration.md) first
2. Review relevant step components in [Component Reference](../../docs/lease-signing/component-reference.md)
3. Check [Template Workflows](../../docs/lease-signing/template-workflows.md) for examples

## Directory Structure

```
/src/features/lease-signing/
├── steps/
│   ├── TemplateCreationStep.tsx    # Template creation wizard
│   ├── DocumentCreationStep.tsx    # Document creation from template
│   └── SignerXStep.tsx             # Signature collection
└── README.md                        # This file (pointer to docs)
```

## Important Notes

**PDFEditor Integration**: When using PDFEditor, never wrap it with padding or layout-affecting containers. See the integration guide for details.

**Modular Architecture**: Each step component is designed to be composed together to create different workflows. See the migration guide for the architectural reasoning behind this design.
