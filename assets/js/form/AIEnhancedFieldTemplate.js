import React from "react";
import { Templates } from "@rjsf/semantic-ui";
import { Button, Icon } from "semantic-ui-react";

const { FieldTemplate: DefaultFieldTemplate } = Templates;

/**
 * Wraps the default Semantic UI RJSF FieldTemplate to optionally show an
 * "Enhance with AI" button in the top-right corner of a field.
 *
 * Enable per-field in uiSchema:
 *   "ui:options": { aiEnhance: true }
 *
 * Wire up the handler at the form level via formContext:
 *   formContext={{ onAIEnhance: ({ id, label, value, onChange }) => { ... } }}
 *
 * The handler receives:
 *   id       — RJSF field id (e.g. "root_metadata_description")
 *   label    — human-readable field label
 *   value    — current field value
 *   onChange — call with the new value to update the field
 */
const AIEnhancedFieldTemplate = (props) => {
  const { id, label, formData, onChange, uiSchema, registry } = props;
  const aiEnhance = uiSchema?.["ui:options"]?.aiEnhance ?? false;

  const handleAIEnhance = () => {
    registry.formContext?.onAIEnhance?.({ id, label, value: formData, onChange });
  };

  return (
    <div style={{ position: "relative" }}>
      {aiEnhance && (
        <Button
          type="button"
          size="mini"
          basic
          compact
          icon
          labelPosition="left"
          onClick={handleAIEnhance}
          style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}
        >
          <Icon name="magic" />
          Enhance with AI
        </Button>
      )}
      <DefaultFieldTemplate {...props} />
    </div>
  );
};

export default AIEnhancedFieldTemplate;
