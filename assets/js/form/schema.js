export const schema = (config) => {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["metadata"],
    properties: {
      files: {
        type: "object",
        title: "Files",
        properties: {
          enabled: { type: "boolean", default: true },
        },
      },

      // pids: {
      //   type: "object",
      //   title: "Persistent Identifiers",
      //   properties: {
      //     doi: {
      //       type: "object",
      //       title: "Digital Object Identifier (DOI)",
      //       properties: {
      //         identifier: { type: "string", title: "DOI" },
      //         provider: { type: "string", title: "Provider" },
      //         client: { type: "string", title: "Client" },
      //       },
      //     },
      //   },
      // },

      metadata: {
        type: "object",
        title: "Metadata",
        required: ["title", "publication_date", "creators"],
        properties: {
          // ── Basic information ──────────────────────────────────────────
          resource_type: {
            type: "object",
            title: "Resource Type",
            required: ["id"],
            properties: {
              id: {
                type: "string",
                title: "Type",
                enum: config.vocabularies.resource_type.map((rtype) => rtype.id),
                enumNames: config.vocabularies.resource_type.map((rtype) =>
                  rtype.subtype_name
                    ? `${rtype.type_name} - ${rtype.subtype_name}`
                    : rtype.type_name
                ),
              },
            },
          },

          title: {
            type: "string",
            title: "Title",
          },

          // additional_titles: {
          //   type: "array",
          //   title: "Additional Titles",
          //   items: {
          //     type: "object",
          //     required: ["title"],
          //     properties: {
          //       title: { type: "string", title: "Title" },
          //       type: {
          //         type: "object",
          //         title: "Type",
          //         properties: {
          //           id: { type: "string" },
          //         },
          //       },
          //       lang: {
          //         type: "object",
          //         title: "Language",
          //         properties: {
          //           id: { type: "string" },
          //         },
          //       },
          //     },
          //   },
          // },

          publication_date: {
            type: "string",
            title: "Publication Date",
            description:
              "Accepted formats: YYYY, YYYY-MM, YYYY-MM-DD, and date ranges.",
          },

          creators: {
            type: "array",
            title: "Authors / Creators",
            description:
              "Names that should appear in the citation. Use Contributors for other names.",
            minItems: 1,
            items: {
              type: "object",
              required: ["person_or_org"],
              properties: {
                person_or_org: {
                  type: "object",
                  title: "Person or Organisation",
                  required: ["type"],
                  properties: {
                    type: {
                      type: "string",
                      title: "Type",
                      enum: ["personal", "organizational"],
                      enumNames: ["Person", "Organization"],
                    },
                    given_name: { type: "string", title: "Given name" },
                    family_name: { type: "string", title: "Family name" },
                    // name: {
                    //   type: "string",
                    //   title: "Name",
                    //   description: "Full name of the organisation.",
                    // },
                    // identifiers: {
                    //   type: "array",
                    //   title: "Identifiers",
                    //   items: {
                    //     type: "object",
                    //     properties: {
                    //       identifier: { type: "string", title: "Identifier" },
                    //       scheme: { type: "string", title: "Scheme" },
                    //     },
                    //   },
                    // },
                  },
                },
                // role: {
                //   type: "object",
                //   title: "Role",
                //   properties: {
                //     id: { type: "string" },
                //   },
                // },
                affiliations: {
                  type: "array",
                  title: "Affiliations",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", title: "ROR / ID" },
                      name: { type: "string", title: "Name" },
                    },
                  },
                },
              },
            },
          },

          description: {
            type: "string",
            title: "Description",
          },

          // additional_descriptions: {
          //   type: "array",
          //   title: "Additional Descriptions",
          //   items: {
          //     type: "object",
          //     required: ["description", "type"],
          //     properties: {
          //       description: { type: "string", title: "Description" },
          //       type: {
          //         type: "object",
          //         title: "Type",
          //         required: ["id"],
          //         properties: {
          //           id: { type: "string" },
          //         },
          //       },
          //       lang: {
          //         type: "object",
          //         title: "Language",
          //         properties: {
          //           id: { type: "string" },
          //         },
          //       },
          //     },
          //   },
          // },

          // rights: {
          //   type: "array",
          //   title: "Licenses",
          //   items: {
          //     type: "object",
          //     properties: {
          //       id: { type: "string", title: "License ID" },
          //       title: { type: "string", title: "Title" },
          //       description: { type: "string", title: "Description" },
          //       link: { type: "string", title: "URL", format: "uri" },
          //     },
          //   },
          // },

          copyright: {
            type: "string",
            title: "Copyright",
          },

          // ── Recommended information ────────────────────────────────────
          contributors: {
            type: "array",
            title: "Contributors",
            description:
              "Not included in the citation, but shown on the record page.",
            items: {
              type: "object",
              required: ["person_or_org"],
              properties: {
                person_or_org: {
                  type: "object",
                  title: "Person or Organisation",
                  properties: {
                    type: { type: "string" },
                    given_name: { type: "string" },
                    family_name: { type: "string" },
                    name: { type: "string" },
                    identifiers: { type: "array", items: { type: "object" } },
                  },
                },
                role: {
                  type: "object",
                  title: "Role",
                  properties: { id: { type: "string" } },
                },
                affiliations: {
                  type: "array",
                  items: { type: "object" },
                },
              },
            },
          },

          // subjects: {
          //   type: "array",
          //   title: "Subjects",
          //   items: {
          //     type: "object",
          //     properties: {
          //       id: { type: "string", title: "ID" },
          //       subject: { type: "string", title: "Subject" },
          //       scheme: { type: "string", title: "Scheme" },
          //     },
          //   },
          // },

          // languages: {
          //   type: "array",
          //   title: "Languages",
          //   items: {
          //     type: "object",
          //     required: ["id"],
          //     properties: {
          //       id: { type: "string", title: "Language" },
          //     },
          //   },
          // },

          // dates: {
          //   type: "array",
          //   title: "Additional Dates",
          //   items: {
          //     type: "object",
          //     required: ["date", "type"],
          //     properties: {
          //       date: { type: "string", title: "Date" },
          //       type: {
          //         type: "object",
          //         title: "Type",
          //         required: ["id"],
          //         properties: {
          //           id: { type: "string" },
          //         },
          //       },
          //       description: { type: "string", title: "Description" },
          //     },
          //   },
          // },

          version: {
            type: "string",
            title: "Version",
            description: "Denote the version of the resource (e.g. v1.0.0).",
          },

          publisher: {
            type: "string",
            title: "Publisher",
          },

          // ── Funding ────────────────────────────────────────────────────
          // funding: {
          //   type: "array",
          //   title: "Awards / Grants",
          //   items: {
          //     type: "object",
          //     properties: {
          //       funder: {
          //         type: "object",
          //         title: "Funder",
          //         properties: {
          //           id: { type: "string", title: "Funder ID" },
          //           name: { type: "string", title: "Name" },
          //           title: { type: "string", title: "Title" },
          //           country: { type: "string", title: "Country" },
          //           identifiers: {
          //             type: "array",
          //             title: "Identifiers",
          //             items: {
          //               type: "object",
          //               properties: {
          //                 identifier: { type: "string" },
          //                 scheme: { type: "string" },
          //               },
          //             },
          //           },
          //         },
          //       },
          //       award: {
          //         type: "object",
          //         title: "Award",
          //         properties: {
          //           id: { type: "string", title: "Award ID" },
          //           title: { type: "string", title: "Title" },
          //           number: { type: "string", title: "Number" },
          //           acronym: { type: "string", title: "Acronym" },
          //           identifiers: {
          //             type: "array",
          //             title: "Identifiers",
          //             items: {
          //               type: "object",
          //               properties: {
          //                 identifier: { type: "string" },
          //                 scheme: { type: "string" },
          //               },
          //             },
          //           },
          //         },
          //       },
          //     },
          //   },
          // },

          // // ── Alternate identifiers ──────────────────────────────────────
          // identifiers: {
          //   type: "array",
          //   title: "Alternate Identifiers",
          //   items: {
          //     type: "object",
          //     required: ["identifier", "scheme"],
          //     properties: {
          //       identifier: { type: "string", title: "Identifier" },
          //       scheme: { type: "string", title: "Scheme" },
          //     },
          //   },
          // },
          //
          // // ── Related works ──────────────────────────────────────────────
          // related_identifiers: {
          //   type: "array",
          //   title: "Related Works",
          //   items: {
          //     type: "object",
          //     required: ["identifier", "scheme", "relation_type"],
          //     properties: {
          //       identifier: { type: "string", title: "Identifier" },
          //       scheme: { type: "string", title: "Scheme" },
          //       relation_type: {
          //         type: "object",
          //         title: "Relation",
          //         required: ["id"],
          //         properties: {
          //           id: { type: "string" },
          //         },
          //       },
          //       resource_type: {
          //         type: "object",
          //         title: "Resource Type",
          //         properties: {
          //           id: { type: "string" },
          //         },
          //       },
          //     },
          //   },
          // },

          // ── References ─────────────────────────────────────────────────
          // references: {
          //   type: "array",
          //   title: "References",
          //   items: {
          //     type: "object",
          //     required: ["reference"],
          //     properties: {
          //       reference: { type: "string", title: "Reference" },
          //       identifier: { type: "string", title: "Identifier" },
          //       scheme: { type: "string", title: "Scheme" },
          //     },
          //   },
          // },
        },
      },

      // ── CERN custom fields ──────────────────────────────────────────────
      custom_fields: {
        type: "object",
        title: "CERN Information",
        additionalProperties: true,
      },

      // ── Access / Visibility ──────────────────────────────────────────────
      // access: {
      //   type: "object",
      //   title: "Visibility",
      //   properties: {
      //     record: {
      //       type: "string",
      //       title: "Record",
      //       enum: ["public", "restricted"],
      //       enumNames: ["Public", "Restricted"],
      //       default: "public",
      //     },
      //     files: {
      //       type: "string",
      //       title: "Files",
      //       enum: ["public", "restricted"],
      //       enumNames: ["Public", "Restricted"],
      //       default: "public",
      //     },
      //     embargo: {
      //       type: "object",
      //       title: "Embargo",
      //       properties: {
      //         active: { type: "boolean", title: "Apply embargo", default: false },
      //         until: {
      //           type: "string",
      //           title: "Embargo until",
      //           format: "date",
      //           description: "Embargo lift date (YYYY-MM-DD).",
      //         },
      //         reason: { type: "string", title: "Reason" },
      //       },
      //     },
      //   },
      // },
    },
  };
};

export default schema;
