import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Accordion,
  Dropdown,
  Grid,
  Icon,
  Input,
  Label,
  Segment,
  Header,
} from "semantic-ui-react";

const DEBOUNCE_MS = 300;

// ── Value converters ──────────────────────────────────────────────────────────
// Vocabulary custom fields are stored as {id} objects in the record but
// Semantic UI Dropdown needs plain string IDs.

const toIds = (val, multiple) => {
  if (!val) return multiple ? [] : "";
  if (multiple) {
    return (Array.isArray(val) ? val : [val]).map((v) =>
      typeof v === "object" ? v.id : v
    );
  }
  return typeof val === "object" ? val.id : val ?? "";
};

const fromIds = (ids, multiple) => {
  if (multiple) {
    return (Array.isArray(ids) ? ids : []).filter(Boolean).map((id) => ({ id }));
  }
  return ids ? { id: ids } : undefined;
};

// Seed existing {id, title_l10n} vocab objects into dropdown choices so the
// current value is always visible even before the async fetch returns.
const seedChoices = (val, multiple) => {
  const items = multiple
    ? Array.isArray(val) ? val : []
    : val ? [val] : [];
  return items
    .filter((v) => v && (typeof v === "object" ? v.id : v))
    .map((v) => {
      const id = typeof v === "object" ? v.id : v;
      const text = v.title_l10n ?? v.title?.en ?? id;
      return { key: id, value: id, text };
    });
};

// ── Async vocabulary Dropdown ─────────────────────────────────────────────────

const VocabDropdown = ({
  apiUrl,
  value,
  onChange,
  multiple = false,
  placeholder,
  groupBySection = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState(() => seedChoices(value, multiple));
  // selectedIds is the local source of truth for the dropdown's displayed value.
  // Initialised from the parent's value prop (handles existing records) but never
  // synced back from it afterwards — the parent re-render passes a new object
  // reference even when content is unchanged, which would cause SUI to reset the
  // open dropdown and drop the selection before the user sees it.
  const [selectedIds, setSelectedIds] = useState(() => toIds(value, multiple));
  const debounceRef = useRef(null);

  const fetchOptions = useCallback(
    async (query) => {
      if (!apiUrl) return;
      setLoading(true);
      try {
        const { data } = await axios.get(apiUrl, {
          params: { size: 50, ...(query ? { suggest: query } : {}) },
        });
        const hits = data?.hits?.hits ?? [];

        if (groupBySection) {
          const current = hits.filter((h) => h.props?.section === "current");
          const former = hits.filter((h) => h.props?.section === "former");
          const other = hits.filter((h) => !h.props?.section);
          const toOpt = (h) => ({
            key: h.id,
            value: h.id,
            text: h.title?.en ?? h.id,
          });
          const header = (key, content) => ({
            key,
            text: "",
            value: null,
            content: (
              <Dropdown.Header
                icon={key === "h-current" ? "building" : "history"}
                content={content}
              />
            ),
            disabled: true,
            isHeader: true,
          });
          setChoices((prev) => {
            const returnedIds = new Set(hits.map((h) => h.id));
            // Keep any previously-seeded option whose id isn't in the fresh results
            // so selected items always have a readable label in SUI Dropdown.
            const preserved = prev.filter(
              (o) => !o.isHeader && o.value && !returnedIds.has(o.value)
            );
            return [
              ...(current.length
                ? [header("h-current", "Current departments"), ...current.map(toOpt)]
                : []),
              ...(former.length
                ? [header("h-former", "Former departments"), ...former.map(toOpt)]
                : []),
              ...other.map(toOpt),
              ...preserved,
            ];
          });
        } else {
          setChoices((prev) => {
            const fresh = hits.map((hit) => ({
              key: hit.id,
              value: hit.id,
              text: hit.title?.en ?? hit.name ?? hit.id,
            }));
            const freshIds = new Set(fresh.map((o) => o.value));
            const preserved = prev.filter((o) => o.value && !freshIds.has(o.value));
            return [...fresh, ...preserved];
          });
        }
      } catch (_) {
        /* keep existing choices on error */
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, groupBySection]
  );

  useEffect(() => {
    fetchOptions("");
  }, [fetchOptions]);

  const handleSearchChange = (_, { searchQuery: q }) => {
    clearTimeout(debounceRef.current);
    if (q) debounceRef.current = setTimeout(() => fetchOptions(q), DEBOUNCE_MS);
  };

  const handleChange = (_, { value: v }) => {
    const next = multiple ? (v ?? []) : (v ?? "");
    setSelectedIds(next);
    const payload = fromIds(next, multiple);
    // Treat empty array/string the same as cleared — store undefined so the
    // field is absent from the saved record rather than present with []/""
    onChange(Array.isArray(payload) && payload.length === 0 ? undefined : payload);
  };

  const searchProp = groupBySection
    ? (opts, q) =>
        opts.filter(
          (o) => !o.isHeader && o.text.toLowerCase().includes(q.toLowerCase())
        )
    : true;

  return (
    <Dropdown
      fluid
      selection
      search={searchProp}
      clearable
      multiple={multiple}
      loading={loading}
      options={choices}
      value={selectedIds}
      placeholder={placeholder}
      onSearchChange={handleSearchChange}
      onChange={handleChange}
    />
  );
};

// ── Tag input for free-text keyword arrays (projects / studies / facilities) ──

const TagInput = ({ value = [], onChange, placeholder }) => {
  const [inputVal, setInputVal] = useState("");

  const add = () => {
    const trimmed = inputVal.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputVal("");
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !inputVal && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div>
      {value.map((tag) => (
        <Label key={tag} style={{ marginBottom: "0.25em" }}>
          {tag}
          <Icon name="delete" onClick={() => remove(tag)} />
        </Label>
      ))}
      <Input
        fluid
        transparent={value.length > 0}
        placeholder={value.length ? "" : placeholder}
        value={inputVal}
        onChange={(_, { value: v }) => setInputVal(v)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        size="small"
      />
    </div>
  );
};

// ── Labeled field row ─────────────────────────────────────────────────────────

const FieldRow = ({ label, icon, description, children }) => (
  <div className="field">
    <label>
      {icon && <Icon name={icon} />}
      {label}
    </label>
    {children}
    {description && (
      <small style={{ color: "#666" }}>{description}</small>
    )}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const CERNCustomField = ({ formData = {}, onChange }) => {
  const [active, setActive] = useState(true);

  const set = (field, val) => onChange({ ...formData, [field]: val });

  const FIELDS = {
    departments: {
      apiUrl: "/api/vocabularies/departments",
      multiple: true,
      placeholder: "Select department(s)…",
      groupBySection: true,
    },
    committees: {
      apiUrl: "/api/vocabularies/committees",
      multiple: true,
      placeholder: "Select committee(s)…",
    },
    programmes: {
      apiUrl: "/api/vocabularies/programmes",
      multiple: false,
      placeholder: "Select programme…",
    },
    accelerators: {
      apiUrl: "/api/vocabularies/accelerators",
      multiple: true,
      placeholder: "Select accelerator(s)…",
    },
    experiments: {
      apiUrl: "/api/vocabularies/experiments",
      multiple: true,
      placeholder: "Select experiment(s)…",
    },
    beams: {
      apiUrl: "/api/vocabularies/beams",
      multiple: true,
      placeholder: "Select beam(s)…",
    },
  };

  return (
    <Accordion fluid styled>
      <Accordion.Title
        active={active}
        onClick={() => setActive((a) => !a)}
        style={{ fontWeight: "bold" }}
      >
        <Icon name="dropdown" />
        CERN Information
      </Accordion.Title>
      <Accordion.Content active={active}>
        <div className="ui form">
          {/* ── Organisation ────────────────────────────────────────── */}
          <Grid>
            <Grid.Column computer={8}>
              <FieldRow
                label="Department"
                icon="building"
                description="Select a recognised CERN department, e.g. BE, EN, HR."
              >
                <VocabDropdown
                  {...FIELDS.departments}
                  value={formData["cern:departments"]}
                  onChange={(v) => set("cern:departments", v)}
                />
              </FieldRow>
            </Grid.Column>

            <Grid.Column computer={8}>
              <FieldRow
                label="Administrative Unit"
                icon="clipboard"
                description="Detailed administrative unit: group‑section."
              >
                <Input
                  fluid
                  placeholder="e.g. BE-RF"
                  value={formData["cern:administrative_unit"] ?? ""}
                  onChange={(_, { value: v }) =>
                    set("cern:administrative_unit", v || undefined)
                  }
                />
              </FieldRow>
            </Grid.Column>
          </Grid>

          <FieldRow
            label="Programme"
            icon="graduation cap"
            description="Select a CERN Programme applicable to your record."
          >
            <VocabDropdown
              {...FIELDS.programmes}
              value={formData["cern:programmes"]}
              onChange={(v) => set("cern:programmes", v)}
            />
          </FieldRow>

          {/* ── Physics ─────────────────────────────────────────────── */}
          <Segment vertical style={{ paddingTop: "0.5em", paddingBottom: 0 }}>
            <Header size="tiny">
              <Icon name="bullseye" />
              Physics
            </Header>
          </Segment>

          <FieldRow
            label="Experiment"
            icon="lab"
            description="Select experiments related to this record, e.g. ATLAS, CMS, LHCb."
          >
            <VocabDropdown
              {...FIELDS.experiments}
              value={formData["cern:experiments"]}
              onChange={(v) => set("cern:experiments", v)}
            />
          </FieldRow>

          <Grid>
            <Grid.Column computer={12}>
              <FieldRow
                label="Accelerator"
                icon="magnet"
                description="Select accelerator(s), e.g. LHC, SPS, PS."
              >
                <VocabDropdown
                  {...FIELDS.accelerators}
                  value={formData["cern:accelerators"]}
                  onChange={(v) => set("cern:accelerators", v)}
                />
              </FieldRow>
            </Grid.Column>

            <Grid.Column computer={4}>
              <FieldRow label="Beam" icon="bullseye">
                <VocabDropdown
                  {...FIELDS.beams}
                  value={formData["cern:beams"]}
                  onChange={(v) => set("cern:beams", v)}
                />
              </FieldRow>
            </Grid.Column>
          </Grid>

          {/* ── Research activities ──────────────────────────────────── */}
          <Segment vertical style={{ paddingTop: "0.5em", paddingBottom: 0 }}>
            <Header size="tiny">
              <Icon name="chart line" />
              Research Activities
            </Header>
          </Segment>

          <FieldRow
            label="Committee"
            icon="users"
            description="Select CERN committee(s) related to this record."
          >
            <VocabDropdown
              {...FIELDS.committees}
              value={formData["cern:committees"]}
              onChange={(v) => set("cern:committees", v)}
            />
          </FieldRow>

          <FieldRow
            label="Projects"
            description="e.g. HL-LHC, HIE-ISOLDE. Press Enter to add."
          >
            <TagInput
              value={formData["cern:projects"] ?? []}
              onChange={(v) => set("cern:projects", v.length ? v : undefined)}
              placeholder="Type a project and press Enter…"
            />
          </FieldRow>

          <Grid>
            <Grid.Column computer={8}>
              <FieldRow
                label="Studies"
                description="e.g. CLICdp, VHE-LHC. Press Enter to add."
              >
                <TagInput
                  value={formData["cern:studies"] ?? []}
                  onChange={(v) => set("cern:studies", v.length ? v : undefined)}
                  placeholder="Type a study and press Enter…"
                />
              </FieldRow>
            </Grid.Column>

            <Grid.Column computer={8}>
              <FieldRow
                label="Facilities"
                description="e.g. ISOLDE, HiRadMat. Press Enter to add."
              >
                <TagInput
                  value={formData["cern:facilities"] ?? []}
                  onChange={(v) =>
                    set("cern:facilities", v.length ? v : undefined)
                  }
                  placeholder="Type a facility and press Enter…"
                />
              </FieldRow>
            </Grid.Column>
          </Grid>
        </div>
      </Accordion.Content>
    </Accordion>
  );
};

export default CERNCustomField;
