import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown } from "semantic-ui-react";
import axios from "axios";

const DEBOUNCE_MS = 300;

// Handles both "title.en" (vocabularies) and "name" (names/affiliations).
const extractLabel = (hit, labelKey) => {
  if (labelKey) {
    return labelKey.split(".").reduce((o, k) => o?.[k], hit) ?? hit.id;
  }
  return hit.title?.en ?? hit.name ?? hit.id;
};

/**
 * RJSF custom widget for selects populated from an InvenioRDM API endpoint.
 *
 * ui:options:
 *   apiUrl      (required) — e.g. "/api/vocabularies/departments"
 *   labelKey    (optional) — dot-path to label field; auto-detected if omitted
 *   searchParam (optional) — query param name for search, default "suggest"
 *   size        (optional) — max results per request, default 20
 */
const RemoteSelectWidget = ({
  id,
  value,
  onChange,
  options,
  disabled,
  readonly,
  placeholder,
}) => {
  const { apiUrl, labelKey, searchParam = "suggest", size = 20 } = options;

  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState([]);
  const debounceRef = useRef(null);

  const fetchOptions = useCallback(
    async (query) => {
      if (!apiUrl) return;
      setLoading(true);
      try {
        const params = { size };
        if (query) params[searchParam] = query;
        const { data } = await axios.get(apiUrl, { params });
        const hits = data?.hits?.hits ?? [];
        setChoices(
          hits.map((hit) => ({
            key: hit.id,
            value: hit.id,
            text: extractLabel(hit, labelKey),
          }))
        );
      } catch (_) {
        setChoices([]);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, labelKey, searchParam, size]
  );

  // Load initial options on mount.
  useEffect(() => {
    fetchOptions("");
  }, [fetchOptions]);

  // Let SUI own the search input display; we only listen to trigger API refetches.
  const handleSearchChange = (_, { searchQuery: q }) => {
    clearTimeout(debounceRef.current);
    if (q) debounceRef.current = setTimeout(() => fetchOptions(q), DEBOUNCE_MS);
  };

  return (
    <Dropdown
      id={id}
      fluid
      selection
      search
      clearable
      loading={loading}
      options={choices}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled || readonly}
      onSearchChange={handleSearchChange}
      onChange={(_, { value: v }) => onChange(v || undefined)}
    />
  );
};

export default RemoteSelectWidget;
