// UI schema for react-jsonschema-form matching the RDMDepositForm sections:
//   Files · Basic information · Recommended information · Funding ·
//   Alternate identifiers · Related works · References · Visibility (sidebar)

export const uiSchema = {
  "ui:order": ["files", "pids", "metadata", "custom_fields", "access"],

  // ── Files ─────────────────────────────────────────────────────────────────
  files: {
    "ui:title": "Files",
    "ui:field": "filesField",
    "ui:options": { section: "files-section" },
  },

  // ── PIDs ─────────────────────────────────────────────────────────────────
  pids: {
    "ui:title": "Persistent Identifiers",
    "ui:options": { section: "basic-information-section" },
    doi: {
      identifier: {
        "ui:placeholder": "e.g. 10.1234/example",
        "ui:help": "Leave blank to auto-generate a DOI after publishing.",
      },
      provider: { "ui:widget": "hidden" },
      client: { "ui:widget": "hidden" },
    },
  },

  // ── Metadata ─────────────────────────────────────────────────────────────
  metadata: {
    "ui:order": [
      // Basic information
      "resource_type",
      "title",
      "additional_titles",
      "publication_date",
      "creators",
      "description",
      "additional_descriptions",
      "rights",
      "copyright",
      // Recommended information
      "contributors",
      "subjects",
      "languages",
      "dates",
      "version",
      "publisher",
      // Funding
      "funding",
      // Alternate identifiers
      "identifiers",
      // Related works
      "related_identifiers",
      // References
      "references",
    ],

    // ── Basic information ───────────────────────────────────────────────
    resource_type: {
      "ui:title": "Resource Type",
      "ui:options": { section: "basic-information-section" },
      id: {
        "ui:widget": "select",
        "ui:placeholder": "Select resource type…",
      },
    },

    title: {
      "ui:widget": "text",
      "ui:placeholder": "Enter the record title",
      "ui:options": { section: "basic-information-section", aiEnhance: true },
    },

    additional_titles: {
      "ui:options": {
        section: "basic-information-section",
        addable: true,
        orderable: false,
        removable: true,
      },
      items: {
        title: { "ui:widget": "text", "ui:placeholder": "Additional title" },
        type: {
          id: { "ui:widget": "select", "ui:placeholder": "Select type…" },
        },
        lang: {
          id: { "ui:widget": "select", "ui:placeholder": "Select language…" },
        },
      },
    },

    publication_date: {
      "ui:widget": "text",
      "ui:placeholder": "YYYY-MM-DD",
      "ui:options": { section: "basic-information-section" },
    },

    creators: {
      "ui:field": "creatorsField",
      "ui:options": { section: "basic-information-section" },
    },

    description: {
      "ui:widget": "textarea",
      "ui:options": {
        rows: 6,
        section: "basic-information-section",
      },
      "ui:placeholder": "Describe the record…",
    },

    additional_descriptions: {
      "ui:options": {
        section: "basic-information-section",
        addable: true,
        orderable: false,
        removable: true,
        addButtonLabel: "Add description",
      },
      items: {
        description: {
          "ui:widget": "textarea",
          "ui:options": { rows: 4 },
          "ui:placeholder": "Description text",
        },
        type: {
          id: { "ui:widget": "select", "ui:placeholder": "Select type…" },
        },
        lang: {
          id: { "ui:widget": "select", "ui:placeholder": "Select language…" },
        },
      },
    },

    rights: {
      "ui:title": "Licenses",
      "ui:options": {
        section: "basic-information-section",
        addable: true,
        removable: true,
        addButtonLabel: "Add license",
      },
      items: {
        id: {
          "ui:widget": "select",
          "ui:placeholder": "Search for a license…",
        },
        title: { "ui:widget": "hidden" },
        description: { "ui:widget": "hidden" },
        link: { "ui:widget": "hidden" },
      },
    },

    copyright: {
      "ui:widget": "text",
      "ui:placeholder": "e.g. © 2024 CERN",
      "ui:options": { section: "basic-information-section" },
    },

    // ── Recommended information ─────────────────────────────────────────
    contributors: {
      "ui:field": "contributorsField",
      "ui:options": { section: "recommended-information-section" },
    },

    subjects: {
      "ui:options": {
        section: "recommended-information-section",
        addable: true,
        removable: true,
        addButtonLabel: "Add subject",
      },
      items: {
        id: { "ui:widget": "hidden" },
        subject: { "ui:placeholder": "Subject keyword" },
        scheme: { "ui:widget": "hidden" },
      },
    },

    languages: {
      "ui:options": {
        section: "recommended-information-section",
        addable: true,
        removable: true,
        addButtonLabel: "Add language",
      },
      items: {
        id: {
          "ui:widget": "select",
          "ui:placeholder": "Search for a language…",
        },
      },
    },

    dates: {
      "ui:options": {
        section: "recommended-information-section",
        addable: true,
        orderable: false,
        removable: true,
        addButtonLabel: "Add date",
      },
      items: {
        date: { "ui:placeholder": "YYYY-MM-DD or range" },
        type: {
          id: { "ui:widget": "select", "ui:placeholder": "Select date type…" },
        },
        description: { "ui:placeholder": "Optional description" },
      },
    },

    version: {
      "ui:widget": "text",
      "ui:placeholder": "e.g. v1.0.0",
      "ui:options": { section: "recommended-information-section" },
    },

    publisher: {
      "ui:widget": "text",
      "ui:placeholder": "Publisher name",
      "ui:options": { section: "recommended-information-section" },
    },

    // ── Funding ─────────────────────────────────────────────────────────
    funding: {
      "ui:title": "Awards / Grants",
      "ui:options": {
        section: "funding-section",
        addable: true,
        orderable: false,
        removable: true,
        addButtonLabel: "Add award / grant",
      },
      items: {
        "ui:order": ["funder", "award"],
        funder: {
          id: {
            "ui:widget": "select",
            "ui:placeholder": "Search for a funder…",
          },
          name: { "ui:placeholder": "Funder name" },
          title: { "ui:widget": "hidden" },
          country: { "ui:widget": "hidden" },
          identifiers: { "ui:widget": "hidden" },
        },
        award: {
          id: {
            "ui:widget": "select",
            "ui:placeholder": "Search for an award…",
          },
          title: { "ui:placeholder": "Award title" },
          number: { "ui:placeholder": "Award number" },
          acronym: { "ui:placeholder": "Acronym" },
          identifiers: { "ui:widget": "hidden" },
        },
      },
    },

    // ── Alternate identifiers ────────────────────────────────────────────
    identifiers: {
      "ui:title": "Alternate Identifiers",
      "ui:options": {
        section: "alternate-identifiers-section",
        addable: true,
        orderable: false,
        removable: true,
        addButtonLabel: "Add identifier",
      },
      items: {
        identifier: { "ui:placeholder": "Identifier value" },
        scheme: {
          "ui:widget": "select",
          "ui:placeholder": "Select scheme…",
        },
      },
    },

    // ── Related works ────────────────────────────────────────────────────
    related_identifiers: {
      "ui:title": "Related Works",
      "ui:options": {
        section: "related-works-section",
        addable: true,
        orderable: false,
        removable: true,
        addButtonLabel: "Add related work",
      },
      items: {
        "ui:order": ["scheme", "identifier", "relation_type", "resource_type"],
        identifier: { "ui:placeholder": "Identifier value" },
        scheme: {
          "ui:widget": "select",
          "ui:placeholder": "Select scheme…",
        },
        relation_type: {
          id: { "ui:widget": "select", "ui:placeholder": "Select relation…" },
        },
        resource_type: {
          id: {
            "ui:widget": "select",
            "ui:placeholder": "Select resource type…",
          },
        },
      },
    },

    // ── References ───────────────────────────────────────────────────────
    references: {
      "ui:title": "References",
      "ui:options": {
        section: "references-section",
        addable: true,
        orderable: false,
        removable: true,
        addButtonLabel: "Add reference",
      },
      items: {
        reference: {
          "ui:widget": "textarea",
          "ui:options": { rows: 3 },
          "ui:placeholder": "Full reference string",
        },
        identifier: { "ui:placeholder": "Linked identifier (optional)" },
        scheme: {
          "ui:widget": "select",
          "ui:placeholder": "Select scheme…",
        },
      },
    },
  },

  // ── CERN custom fields ───────────────────────────────────────────────────
  custom_fields: {
    "ui:field": "cernCustomField",
    "ui:title": "CERN Information",
  },

  // ── Access / Visibility (sidebar) ────────────────────────────────────────
  access: {
    "ui:title": "Visibility",
    "ui:options": { section: "visibility-section" },
    record: {
      "ui:widget": "radio",
      "ui:options": { inline: true },
    },
    files: {
      "ui:widget": "radio",
      "ui:options": { inline: true },
    },
    embargo: {
      active: { "ui:widget": "checkbox" },
      until: {
        "ui:widget": "date",
        "ui:placeholder": "YYYY-MM-DD",
      },
      reason: {
        "ui:widget": "textarea",
        "ui:options": { rows: 2 },
        "ui:placeholder": "Reason for embargo (optional)",
      },
    },
  },
};

export default uiSchema;
