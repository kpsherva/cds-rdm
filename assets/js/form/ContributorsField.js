import React, { useState } from "react";
import { Button, Grid, Icon, Label } from "semantic-ui-react";
import { CreatorForm, getOrcid, getAffiliation } from "./CreatorsField";

// ── Summary row ──────────────────────────────────────────────────────────────

const ContributorSummaryRow = ({ contributor, roleOptions, onEdit, onRemove }) => {
  const name = contributor.person_or_org?.name ?? "—";
  const type = contributor.person_or_org?.type ?? "personal";
  const orcid = getOrcid(contributor);
  const affiliation = getAffiliation(contributor);
  const roleId = contributor.role?.id;
  const roleLabel = roleOptions.find((r) => r.value === roleId)?.text ?? roleId;

  return (
    <Grid.Row
      verticalAlign="middle"
      style={{ padding: "0.5em 0", borderBottom: "1px solid #f0f0f0" }}
    >
      <Grid.Column width={1}>
        <Icon name="bars" style={{ cursor: "grab", color: "#ccc" }} />
      </Grid.Column>

      <Grid.Column width={4}>
        <Icon
          name={type === "organizational" ? "building" : "user outline"}
          color="grey"
        />
        <strong>{name}</strong>
      </Grid.Column>

      <Grid.Column width={3}>
        {roleLabel ? (
          <Label size="tiny" color="blue">
            {roleLabel}
          </Label>
        ) : (
          <span style={{ color: "#aaa", fontSize: "0.85em" }}>No role</span>
        )}
      </Grid.Column>

      <Grid.Column width={3}>
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
            <Icon
              name="external alternate"
              style={{ marginLeft: "0.3em", marginRight: 0 }}
            />
          </Label>
        ) : (
          <span style={{ color: "#aaa", fontSize: "0.85em" }}>
            <Icon name="circle outline" />
            No ORCID
          </span>
        )}
      </Grid.Column>

      <Grid.Column width={3}>
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
        <Icon
          link
          name="pencil"
          color="grey"
          onClick={onEdit}
          title="Edit"
          style={{ marginRight: "0.5em" }}
        />
        <Icon
          link
          name="trash alternate outline"
          color="red"
          onClick={onRemove}
          title="Remove"
        />
      </Grid.Column>
    </Grid.Row>
  );
};

// ── Main field ───────────────────────────────────────────────────────────────

const ContributorsField = ({ formData = [], onChange, registry }) => {
  const roleOptions =
    registry?.formContext?.config?.vocabularies?.contributors?.role ?? [];

  // Same local-state-as-source-of-truth pattern as CreatorsField.
  const [items, setItems] = useState(formData);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftContributor, setDraftContributor] = useState(null);

  const openAdd = () => {
    setEditingIndex(-1);
    setDraftContributor({ person_or_org: { type: "personal" } });
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setDraftContributor(items[index]);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setDraftContributor(null);
  };

  const handleSave = () => {
    const updated =
      editingIndex === -1
        ? [...items, draftContributor]
        : items.map((c, i) => (i === editingIndex ? draftContributor : c));
    setItems(updated);
    setEditingIndex(null);
    setDraftContributor(null);
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraftContributor(null);
    }
    onChange(updated);
  };

  // CreatorForm calls onChange with { person_or_org, affiliations }.
  // Merge role back so it isn't lost when the person fields change.
  const handlePersonChange = (updatedPerson) => {
    setDraftContributor({ ...updatedPerson, role: draftContributor?.role });
  };

  const handleRoleChange = (role) => {
    setDraftContributor({ ...draftContributor, role });
  };

  return (
    <div>
      {/* ── Header ── */}
      <Grid>
        <Grid.Row verticalAlign="middle" style={{ paddingBottom: "0.25em" }}>
          <Grid.Column width={10}>
            <span style={{ color: "#666", fontSize: "0.85em" }}>
              People or organizations who contributed but should not appear in the citation.
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
              Add Contributor
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* ── Contributor list ── */}
      {items.length > 0 && (
        <Grid style={{ margin: 0 }}>
          {items.map((contributor, i) => (
            <ContributorSummaryRow
              key={i}
              contributor={contributor}
              roleOptions={roleOptions}
              onEdit={() => openEdit(i)}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </Grid>
      )}

      {/* ── Add / Edit form ── */}
      {editingIndex !== null && draftContributor !== null && (
        <CreatorForm
          creator={draftContributor}
          onChange={handlePersonChange}
          onSave={handleSave}
          onCancel={handleCancel}
          isNew={editingIndex === -1}
          roleOptions={roleOptions}
          roleValue={draftContributor.role}
          onRoleChange={handleRoleChange}
        />
      )}
    </div>
  );
};

export default ContributorsField;
