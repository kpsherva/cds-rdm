import React, { Component, createRef } from "react";
import Form from "@rjsf/semantic-ui";
import validator from "@rjsf/validator-ajv8";
import axios from "axios";
import PropTypes from "prop-types";
import {
  Button,
  Container,
  Grid,
  Header,
  Icon,
  Label,
  Segment,
} from "semantic-ui-react";
import { Divider } from "semantic-ui-react";
import schema from "./schema";
import uiSchema from "./ui_schema";
import RemoteSelectWidget from "./RemoteSelectWidget";
import FilesField from "./FilesField";
import CreatorsField from "./CreatorsField";
import AIEnhancedFieldTemplate from "./AIEnhancedFieldTemplate";
import CERNCustomField from "./CERNCustomField";
import ContributorsField from "./ContributorsField";
import { getInputFromDOM } from "@js/invenio_rdm_records";

const widgets = { remoteSelect: RemoteSelectWidget };
const fields = {
  filesField: FilesField,
  creatorsField: CreatorsField,
  contributorsField: ContributorsField,
  cernCustomField: CERNCustomField,
};

const templates = {
  ButtonTemplates: { SubmitButton: () => null },
  FieldTemplate: AIEnhancedFieldTemplate,
};

// Converts [{field: "metadata.creators.0.type", messages: [...]}]
// to RJSF extraErrors: {metadata: {creators: {0: {type: {__errors: [...]}}}}}
const toExtraErrors = (errors = []) => {
  const result = {};
  for (const { field, messages } of errors) {
    const parts = field.split(".");
    let node = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!node[key]) node[key] = {};
      node = node[key];
    }
    const last = parts[parts.length - 1];
    if (!node[last]) node[last] = {};
    node[last].__errors = messages;
  }
  return result;
};

// For a new record the backend sends a null-filled template. Extract only the
// meaningful defaults (publication_date, publisher, files.enabled) so RJSF
// doesn't see hundreds of null fields.
const newRecordDefaults = (raw) => ({
  files: { enabled: raw.files?.enabled ?? true },
  metadata: {
    ...(raw.metadata?.publication_date && {
      publication_date: raw.metadata.publication_date,
    }),
    ...(raw.metadata?.publisher && { publisher: raw.metadata.publisher }),
  },
});

export class RDMForm extends Component {
  constructor(props) {
    super(props);
    this.config = getInputFromDOM("deposits-config");
    this.schema = schema(this.config);
    this.formRef = createRef();

    const raw = getInputFromDOM("deposits-record") ?? {};
    const isExisting = !!raw.id;

    // state must be set in the constructor so we can use the DOM-derived values;
    // class-field `state = {}` initializers run before the constructor body and
    // would see undefined for anything set here.
    this.state = {
      formData: isExisting ? raw : newRecordDefaults(raw),
      draftRecord: isExisting ? raw : {},
      extraErrors: {},
      saving: false,
    };
  }

  getCsrfToken = () => {
    const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? match[1] : "";
  };

  saveDraft = async (formData) => {
    const { draftRecord, formData: stateFormData } = this.state;
    const { config } = this.props;
    const isNew = !draftRecord?.links?.self;
    const url = isNew
      ? config?.createUrl ?? "/api/records"
      : draftRecord.links.self;

    this.setState({ saving: true });
    try {
      const { data } = await axios({
        method: isNew ? "post" : "put",
        url,
        data: formData ?? stateFormData,
        params: { expand: 1 },
        headers: { "X-CSRFToken": this.getCsrfToken() },
      });
      this.setState({
        draftRecord: data,
        extraErrors: toExtraErrors(data.errors),
      });
      return data;
    } catch (err) {
      console.error("Error saving draft", err);
      return null;
    } finally {
      this.setState({ saving: false });
    }
  };

  onSubmit = async ({ formData }) => {
    const saved = await this.saveDraft(formData);
    if (!saved) return;

    if (saved.errors?.length) return;

    // Update URL bar for a newly created draft without reloading.
    const isNew = !this.props.record?.links?.self;
    if (isNew && saved.links?.self_html) {
      window.history.pushState(null, "", saved.links.self_html);
    }
  };

  onFormChange = ({ formData }) => {
    this.setState({ formData });
  };

  handleSaveDraftClick = () => {
    // Delegate to RJSF's submit so schema validation still runs first.
    this.formRef.current?.submit();
  };

  render() {
    const { formData, extraErrors, draftRecord, saving } = this.state;
    const isNew = !draftRecord?.links?.self;
    const recordTitle = formData?.metadata?.title;

    return (
      <>
        {/* ── Deposit header ───────────────────────────────────────────── */}
        <Segment
          vertical
          className="rdm-deposit-header"
          style={{
            background: "#f5f5f5",
            borderBottom: "1px solid #ddd",
            marginBottom: 0,
          }}
        >
          <Container fluid>
            <Grid verticalAlign="middle">
              <Grid.Row>
                <Grid.Column width={10}>
                  <Header as="h2" className="p-20">
                    <Icon name="upload" />
                    <Header.Content>
                      {recordTitle || "New upload"}
                      <Header.Subheader>
                        {isNew ? (
                          "Not yet saved"
                        ) : (
                          <>
                            <Label
                              size="tiny"
                              color="grey"
                              style={{ marginRight: "0.5em" }}
                            >
                              Draft
                            </Label>
                            {draftRecord.id}
                          </>
                        )}
                      </Header.Subheader>
                    </Header.Content>
                  </Header>
                </Grid.Column>

                <Grid.Column width={6} textAlign="right">
                  <Button
                    primary
                    icon
                    labelPosition="left"
                    loading={saving}
                    disabled={saving}
                    onClick={this.handleSaveDraftClick}
                  >
                    <Icon name="save" />
                    Save draft
                  </Button>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </Segment>

        {/* ── RJSF form (no submit button) ─────────────────────────────── */}
        <Grid verticalAlign="middle" className="mt-20">
          <Grid.Column width={3}></Grid.Column>
          <Grid.Column width={8}>
            <Form
              ref={this.formRef}
              schema={this.schema}
              validator={validator}
              uiSchema={uiSchema}
              widgets={widgets}
              fields={fields}
              templates={templates}
              formData={formData}
              extraErrors={extraErrors}
              onChange={this.onFormChange}
              onSubmit={this.onSubmit}
              liveValidate={false}
              formContext={{
                config: this.config,
                draftRecord,
                getCsrfToken: this.getCsrfToken,
                saveDraft: this.saveDraft,
                // Wire up an AI service here later:
                // onAIEnhance: ({ id, label, value, onChange }) => { ... }
                onAIEnhance: null,
              }}
            />
          </Grid.Column>
          <Grid.Column width={3} />
        </Grid>
      </>
    );
  }
}

RDMForm.propTypes = {
  record: PropTypes.object,
  config: PropTypes.object,
};

RDMForm.defaultProps = {
  record: {},
  config: {},
};
