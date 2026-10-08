import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Button,
  Dropdown,
  Grid,
  Icon,
  Input,
  Label,
  Radio,
  Search,
  Segment,
} from "semantic-ui-react";

const DEBOUNCE_MS = 300;

// ── Helpers ─────────────────────────────────────────────────────────────────

export const getOrcid = (creator) =>
  creator?.person_or_org?.identifiers?.find((id) => id.scheme === "orcid")
    ?.identifier;

export const getAffiliation = (creator) => creator?.affiliations?.[0]?.name ?? null;

// ── Summary row ──────────────────────────────────────────────────────────────

const CreatorSummaryRow = ({ creator, onEdit, onRemove }) => {
  const name = creator.person_or_org?.name ?? "—";
  const type = creator.person_or_org?.type ?? "personal";
  const orcid = getOrcid(creator);
  const affiliation = getAffiliation(creator);

  return (
    <Grid.Row verticalAlign="middle" style={{ padding: "0.5em 0", borderBottom: "1px solid #f0f0f0" }}>
      <Grid.Column width={1}>
        <Icon name="bars" style={{ cursor: "grab", color: "#ccc" }} />
      </Grid.Column>

      <Grid.Column width={4}>
        <Icon name={type === "organizational" ? "building" : "user outline"} color="grey" />
        <strong>{name}</strong>
      </Grid.Column>

      <Grid.Column width={4}>
        {orcid ? (
          <Label
            size="tiny"
            color="green"
            as="a"
            href={`https://orcid.org/${orcid}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="id card outline" />
            {orcid}
            <Icon name="external alternate" style={{ marginLeft: "0.3em", marginRight: 0 }} />
          </Label>
        ) : (
          <span style={{ color: "#aaa", fontSize: "0.85em" }}>
            <Icon name="circle outline" />
            Not set
          </span>
        )}
      </Grid.Column>

      <Grid.Column width={5}>
        {affiliation ? (
          <span>
            <Icon name="building outline" color="grey" />
            {affiliation}
          </span>
        ) : (
          <span style={{ color: "#aaa", fontSize: "0.85em" }}>
            <Icon name="building outline" />
            No affiliation
          </span>
        )}
      </Grid.Column>

      <Grid.Column width={2} textAlign="right">
        <Icon link name="pencil" color="grey" onClick={onEdit} title="Edit" style={{ marginRight: "0.5em" }} />
        <Icon link name="trash alternate outline" color="red" onClick={onRemove} title="Remove" />
      </Grid.Column>
    </Grid.Row>
  );
};

// ── Add / Edit form ──────────────────────────────────────────────────────────

export const CreatorForm = ({ creator, onChange, onSave, onCancel, isNew, roleOptions, roleValue, onRoleChange }) => {
  const org = creator?.person_or_org ?? {};
  const type = org.type ?? "personal";
  const isPersonal = type === "personal";
  const orcid = getOrcid(creator) ?? "";
  const affiliation = getAffiliation(creator) ?? "";

  const [searchQuery, setSearchQuery] = useState(org.name ?? "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const setType = (newType) => {
    const currentName = org.name ?? "";
    onChange({
      ...creator,
      person_or_org: {
        type: newType,
        name: currentName,
        // Clear personal-only fields when switching to organizational
        ...(newType === "personal"
          ? { identifiers: org.identifiers ?? [] }
          : { identifiers: [] }),
      },
    });
  };

  const handleSearchChange = useCallback((_, { value }) => {
    setSearchQuery(value);
    onChange({
      ...creator,
      person_or_org: { ...org, name: value },
    });
    clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await axios.get("/api/names", {
          params: { suggest: value, size: 10 },
        });
        const hits = data?.hits?.hits ?? [];
        setResults(
          hits.map((h) => {
            const hOrcid = h.identifiers?.find((i) => i.scheme === "orcid")?.identifier;
            return {
              key: h.id,
              title: h.name,
              description: [hOrcid, h.affiliations?.[0]?.name].filter(Boolean).join(" · "),
              _hit: h,
            };
          })
        );
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
  }, [creator, onChange, org]);

  const handleSelectResult = useCallback((_, { result }) => {
    const h = result._hit;
    const hOrcid = h.identifiers?.find((i) => i.scheme === "orcid")?.identifier;
    setSearchQuery(h.name ?? "");
    setResults([]);
    onChange({
      person_or_org: {
        type: "personal",
        given_name: h.given_name ?? "",
        family_name: h.family_name ?? "",
        name: h.name ?? "",
        identifiers: hOrcid ? [{ identifier: hOrcid, scheme: "orcid" }] : [],
      },
      affiliations: h.affiliations?.map((a) => ({ name: a.name })) ?? [],
    });
  }, [onChange]);

  const setOrcid = (value) => {
    const existing = (org.identifiers ?? []).filter((i) => i.scheme !== "orcid");
    onChange({
      ...creator,
      person_or_org: {
        ...org,
        identifiers: value ? [...existing, { identifier: value, scheme: "orcid" }] : existing,
      },
    });
  };

  const setAffiliation = (value) => {
    onChange({
      ...creator,
      affiliations: value ? [{ name: value }] : [],
    });
  };

  return (
    <Segment style={{ marginTop: "0.5em" }}>
      <div className="ui form">
        {/* ── Type selector ── */}
        <div className="inline fields" style={{ marginBottom: "0.75em" }}>
          <span className="label">Type</span>
          <div className="field">
            <Radio
              label="Personal"
              name="creator-type"
              value="personal"
              checked={isPersonal}
              onChange={() => setType("personal")}
            />
          </div>
          <div className="field">
            <Radio
              label="Organizational"
              name="creator-type"
              value="organizational"
              checked={!isPersonal}
              onChange={() => setType("organizational")}
            />
          </div>
        </div>

        {/* ── Name + ORCID (personal) or Name only (organizational) ── */}
        <div className="fields equal width">
          <div className="required field">
            <label htmlFor="creator-form-name">Name</label>
            {isPersonal ? (
              <Search
                fluid
                loading={searching}
                onSearchChange={handleSearchChange}
                onResultSelect={handleSelectResult}
                results={results}
                value={searchQuery}
                placeholder="Full name"
                showNoResults={searchQuery.length > 1 && !searching && results.length === 0}
                noResultsMessage="No results found."
                input={{ id: "creator-form-name" }}
              />
            ) : (
              <Input
                id="creator-form-name"
                fluid
                placeholder="Organization name"
                value={org.name ?? ""}
                onChange={(_, { value }) =>
                  onChange({ ...creator, person_or_org: { ...org, name: value } })
                }
              />
            )}
          </div>

          {isPersonal && (
            <div className="field">
              <label htmlFor="creator-form-orcid">ORCID</label>
              <Input
                id="creator-form-orcid"
                placeholder="0000-0001-2345-6789"
                value={orcid}
                onChange={(_, { value }) => setOrcid(value)}
              />
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="creator-form-affiliation">Affiliation</label>
          <Input
            id="creator-form-affiliation"
            placeholder="University or organization"
            value={affiliation}
            onChange={(_, { value }) => setAffiliation(value)}
          />
        </div>

        {roleOptions && (
          <div className="field">
            <label htmlFor="creator-form-role">Role</label>
            <Dropdown
              id="creator-form-role"
              fluid
              selection
              clearable
              placeholder="Select role…"
              options={roleOptions.map((r) => ({ key: r.value, value: r.value, text: r.text }))}
              value={roleValue?.id ?? ""}
              onChange={(_, { value: v }) => onRoleChange(v ? { id: v } : undefined)}
            />
          </div>
        )}

        <div style={{ textAlign: "right", marginTop: "0.5em" }}>
          <Button type="button" basic onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            primary
            onClick={onSave}
            disabled={!(isPersonal ? searchQuery.trim() : (org.name ?? "").trim())}
          >
            {isNew ? "Add" : "Save"}
          </Button>
        </div>
      </div>
    </Segment>
  );
};

// ── Main field ───────────────────────────────────────────────────────────────

const CreatorsField = ({ formData = [], onChange }) => {
  // items is the source of truth for rendering. Initialized once from formData
  // (covers both new records and loading existing ones). Never synced back from
  // formData prop after mount — RJSF passes a new array reference on every
  // re-render even when content is unchanged, so syncing would cause an
  // infinite update loop (setItems → RJSF onChange → re-render → setItems…).
  const [items, setItems] = useState(formData);
  // null = closed, -1 = adding new, >= 0 = editing index
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftCreator, setDraftCreator] = useState(null);

  const openAdd = () => {
    setEditingIndex(-1);
    setDraftCreator({ person_or_org: { type: "personal" } });
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setDraftCreator(items[index]);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setDraftCreator(null);
  };

  const handleSave = () => {
    const updated =
      editingIndex === -1
        ? [...items, draftCreator]
        : items.map((c, i) => (i === editingIndex ? draftCreator : c));
    setItems(updated);
    setEditingIndex(null);
    setDraftCreator(null);
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraftCreator(null);
    }
    onChange(updated);
  };

  return (
    <div>
      {/* ── Header ── */}
      <Grid>
        <Grid.Row verticalAlign="middle" style={{ paddingBottom: "0.25em" }}>
          <Grid.Column width={10}>
            <span style={{ color: "#666", fontSize: "0.85em" }}>
              Names that should appear in the citation. Use Contributors for other roles.
            </span>
          </Grid.Column>
          <Grid.Column width={6} textAlign="right">
            <Button
              type="button"
              basic
              size="small"
              icon
              labelPosition="left"
              onClick={openAdd}
              disabled={editingIndex !== null}
            >
              <Icon name="plus" />
              Add Creator
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* ── Creator list ── */}
      {items.length > 0 && (
        <Grid style={{ margin: 0 }}>
          {items.map((creator, i) => (
            <CreatorSummaryRow
              key={i}
              creator={creator}
              onEdit={() => openEdit(i)}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </Grid>
      )}

      {/* ── Add / Edit form ── */}
      {editingIndex !== null && draftCreator !== null && (
        <CreatorForm
          creator={draftCreator}
          onChange={setDraftCreator}
          onSave={handleSave}
          onCancel={handleCancel}
          isNew={editingIndex === -1}
        />
      )}
    </div>
  );
};

export default CreatorsField;
