import React, { useState, useEffect, useCallback } from "react";
import Dropzone from "react-dropzone";
import axios from "axios";
import {
  Button,
  Checkbox,
  Grid,
  Header,
  Icon,
  Label,
  List,
  Message,
  Popup,
  Progress,
  Segment,
  Table,
} from "semantic-ui-react";

const UPLOAD_STATUS = {
  PENDING: "pending",
  UPLOADING: "uploading",
  DONE: "done",
  ERROR: "error",
};

const humanReadableBytes = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const readAllowEmptyFiles = () =>
  document.querySelector('[name="records-resources-allow-empty-files"]')?.value ===
  "true";

/**
 * RJSF ui:field for the `files` object.
 *
 * formContext must provide:
 *   getCsrfToken  — () => string
 *   saveDraft     — (formData?) => Promise<record>
 *   draftRecord   — current saved record (may lack links.files on first load)
 */
const FilesField = ({ formData = {}, onChange, registry }) => {
  const { getCsrfToken, saveDraft, draftRecord } = registry.formContext;
  const allowEmptyFiles = readAllowEmptyFiles();
  const filesEnabled = formData?.enabled !== false;

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [defaultPreview, setDefaultPreview] = useState("");

  // Populate file list from an existing draft's entries on first render.
  useEffect(() => {
    const entries = formData?.entries;
    if (!entries || !Object.keys(entries).length) return;

    const filesBaseUrl = draftRecord?.links?.files;
    const existing = Object.values(entries).map((e) => ({
      name: e.key,
      size: e.size,
      checksum: e.checksum,
      status: UPLOAD_STATUS.DONE,
      progress: 100,
      links: filesBaseUrl
        ? { self: `${filesBaseUrl}/${e.key}`, content: `${filesBaseUrl}/${e.key}/content` }
        : {},
    }));
    setUploadedFiles(existing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  const updateFile = (name, patch) =>
    setUploadedFiles((prev) =>
      prev.map((f) => (f.name === name ? { ...f, ...patch } : f))
    );

  const handleToggleEnabled = () => {
    onChange({ ...formData, enabled: !filesEnabled });
  };

  const uploadFile = useCallback(
    async (file) => {
      // Register the file immediately so the row appears.
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, size: file.size, status: UPLOAD_STATUS.UPLOADING, progress: 0 },
      ]);

      try {
        // Ensure the draft exists so we have links.files.
        let filesUrl = draftRecord?.links?.files;
        if (!filesUrl) {
          const saved = await saveDraft();
          filesUrl = saved?.links?.files;
        }
        if (!filesUrl) throw new Error("Could not obtain files upload URL.");

        const headers = { "X-CSRFToken": getCsrfToken() };

        // 1 – Initialize upload
        const initRes = await axios.post(
          filesUrl,
          [{ key: file.name, size: file.size, transfer: { type: "L" } }],
          { headers }
        );
        const entry = initRes.data.entries.find(
          (e) => e.key.normalize() === file.name.normalize()
        );
        if (!entry) throw new Error("Initialized file entry not found.");

        // 2 – Upload content
        await axios.put(entry.links.content, file, {
          headers: { ...headers, "Content-Type": "application/octet-stream" },
          onUploadProgress: (evt) => {
            const percent = Math.floor((evt.loaded / evt.total) * 100);
            updateFile(file.name, { progress: percent });
          },
        });

        // 3 – Finalize
        const finalRes = await axios.post(entry.links.commit, {}, { headers });
        const { checksum, links } = finalRes.data;
        updateFile(file.name, {
          status: UPLOAD_STATUS.DONE,
          progress: 100,
          checksum,
          links,
        });
      } catch (err) {
        console.error("File upload failed", err);
        updateFile(file.name, { status: UPLOAD_STATUS.ERROR });
      }
    },
    [draftRecord, getCsrfToken, saveDraft]
  );

  const handleDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((f) => uploadFile(f));
    },
    [uploadFile]
  );

  const handleDelete = async (fileEntry) => {
    if (fileEntry.links?.self) {
      try {
        await axios.delete(fileEntry.links.self, {
          headers: { "X-CSRFToken": getCsrfToken() },
        });
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileEntry.name));
    if (defaultPreview === fileEntry.name) setDefaultPreview("");
  };

  const totalSize = uploadedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <Grid>
        <Grid.Row verticalAlign="middle" className="pt-5 pb-10">
          <Grid.Column mobile={16} tablet={4} computer={4}>
            {allowEmptyFiles && (
              <List horizontal>
                <List.Item>
                  <Checkbox
                    label="Metadata-only record"
                    checked={!filesEnabled}
                    disabled={uploadedFiles.some(
                      (f) => f.status === UPLOAD_STATUS.DONE
                    )}
                    onChange={handleToggleEnabled}
                  />
                </List.Item>
                <List.Item className="ml-5">
                  <Popup
                    trigger={<Icon name="question circle outline" className="neutral" />}
                    content="Disable files for this record"
                    position="top center"
                  />
                </List.Item>
              </List>
            )}
          </Grid.Column>

          {filesEnabled && (
            <Grid.Column mobile={16} tablet={12} computer={12} className="storage-col">
              <List horizontal floated="right">
                <List.Item>
                  <Label>{uploadedFiles.length} file(s)</Label>
                </List.Item>
                <List.Item>
                  <Label>{humanReadableBytes(totalSize)}</Label>
                </List.Item>
              </List>
            </Grid.Column>
          )}
        </Grid.Row>
      </Grid>

      {/* ── Upload area ─────────────────────────────────────── */}
      {filesEnabled ? (
        <Dropzone onDrop={handleDrop} noClick noKeyboard>
          {({ getRootProps, getInputProps, open }) => (
            <div {...getRootProps()}>
              <input {...getInputProps()} />

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Preview</Table.HeaderCell>
                      <Table.HeaderCell>Filename</Table.HeaderCell>
                      <Table.HeaderCell>Size</Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">Progress</Table.HeaderCell>
                      <Table.HeaderCell />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {uploadedFiles.map((file) => (
                      <Table.Row key={file.name}>
                        <Table.Cell width={2}>
                          <Popup
                            content="Set as default preview on the record page"
                            trigger={
                              <Icon
                                link
                                name={
                                  defaultPreview === file.name
                                    ? "eye"
                                    : "eye slash outline"
                                }
                                color={defaultPreview === file.name ? "blue" : "grey"}
                                onClick={() =>
                                  setDefaultPreview(
                                    defaultPreview === file.name ? "" : file.name
                                  )
                                }
                              />
                            }
                          />
                        </Table.Cell>
                        <Table.Cell width={8}>
                          {file.links?.content ? (
                            <a
                              href={file.links.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-5 text-break"
                            >
                              {file.name}
                            </a>
                          ) : (
                            <span className="mr-5 text-break">{file.name}</span>
                          )}
                          {file.checksum && (
                            <div className="ui text-muted">
                              <span style={{ fontSize: "10px" }}>{file.checksum}</span>
                              <Popup
                                content="MD5 checksum for file integrity verification"
                                trigger={
                                  <Icon fitted name="help circle" size="small" />
                                }
                                position="top center"
                              />
                            </div>
                          )}
                        </Table.Cell>
                        <Table.Cell width={2}>
                          {humanReadableBytes(file.size)}
                        </Table.Cell>
                        <Table.Cell width={2} textAlign="center">
                          {file.status === UPLOAD_STATUS.UPLOADING && (
                            <Progress
                              className="file-upload-progress primary"
                              percent={file.progress}
                              size="medium"
                              progress
                              autoSuccess
                              active
                            />
                          )}
                          {file.status === UPLOAD_STATUS.DONE && (
                            <Icon name="check circle" color="green" />
                          )}
                          {file.status === UPLOAD_STATUS.ERROR && (
                            <Icon name="times circle" color="red" title="Upload failed" />
                          )}
                        </Table.Cell>
                        <Table.Cell width={2} textAlign="right">
                          {file.status !== UPLOAD_STATUS.UPLOADING && (
                            <Icon
                              link
                              className="action primary"
                              name="trash alternate outline"
                              onClick={() => handleDelete(file)}
                              aria-label="Delete file"
                              title="Delete file"
                            />
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}

              {/* Drop zone */}
              <Segment
                basic
                padded="very"
                className={
                  uploadedFiles.length ? "file-upload-area" : "file-upload-area no-files"
                }
              >
                <Grid columns={3} textAlign="center">
                  <Grid.Row verticalAlign="middle">
                    <Grid.Column mobile={16} tablet={7} computer={7}>
                      <Header size="small">Drag and drop files</Header>
                    </Grid.Column>
                    <Grid.Column
                      className="mt-10 mb-10"
                      mobile={16}
                      tablet={2}
                      computer={2}
                    >
                      — or —
                    </Grid.Column>
                    <Grid.Column mobile={16} tablet={7} computer={7}>
                      <Button
                        type="button"
                        primary
                        labelPosition="left"
                        icon="upload"
                        content="Upload files"
                        onClick={open}
                      />
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Segment>
            </div>
          )}
        </Dropzone>
      ) : (
        <Segment basic padded="very" className="file-upload-area no-files">
          <Grid textAlign="center">
            <Grid.Row verticalAlign="middle">
              <Grid.Column>
                <Header size="medium">This is a Metadata-only record.</Header>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
      )}

      {/* Draft-save warning */}
      {!draftRecord?.links?.files && filesEnabled && (
        <Message info size="small">
          <Icon name="info circle" />
          Files will be attached once you save the record for the first time.
        </Message>
      )}
    </div>
  );
};

export default FilesField;
