import React, { useState, useRef } from "react";
import { TextField, Autocomplete, CircularProgress } from "@mui/material";

/** Analyse simple pour séparer code postal et rue */
function parseAddressParts(raw) {
  if (!raw) return {};
  const cleaned = raw.replace(/\s+/g, " ").replace(/,+/g, ",").trim();
  const pcMatch = cleaned.match(/\b\d{5}\b/);
  const postcode = pcMatch ? pcMatch[0] : undefined;
  let street;
  const chunks = cleaned.split(",").map((s) => s.trim()).filter(Boolean);
  if (chunks.length > 1) street = chunks.find((c) => /^\d+\s+\S+/.test(c)) || chunks[0];
  if (!street) {
    const m = cleaned.match(/(\d+\s+[^\d,]+?)(?:,|$)/);
    if (m) street = m[1].trim();
  }
  return { postcode, street };
}

/** Normalise une option en objet standard */
function normalizeToOption(from, source = "nominatim") {
  if (!from) return null;
  if (source === "nominatim") return {
    source,
    display_name: from.display_name,
    lat: from.lat,
    lon: from.lon,
    boundingbox: from.boundingbox,
    address: from.address,
    raw: from
  };
  return {
    source,
    display_name: from.properties?.label,
    lat: String(from.geometry?.coordinates?.[1]),
    lon: String(from.geometry?.coordinates?.[0]),
    boundingbox: undefined,
    address: {
      housenumber: from.properties?.housenumber,
      road: from.properties?.street || from.properties?.name,
      postcode: from.properties?.postcode,
      city: from.properties?.city,
      country: "France",
      country_code: "fr"
    },
    raw: from
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  countrycodes = "fr",
  acceptLanguage = "fr",
  viewbox,
  minLength = 2,
  debounceMs = 500
}) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(
    typeof value === "string" ? value : value?.display_name || ""
  );
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchNominatim = async (query, parts) => {
    if (!query || query.length < minLength) return [];
    let url = "https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1";
    if (parts?.street && parts?.postcode) url += `&street=${encodeURIComponent(parts.street)}&postalcode=${encodeURIComponent(parts.postcode)}`;
    else url += `&q=${encodeURIComponent(query)}`;
    if (countrycodes) url += `&countrycodes=${encodeURIComponent(countrycodes)}`;
    if (acceptLanguage) url += `&accept-language=${encodeURIComponent(acceptLanguage)}`;
    if (viewbox) url += `&viewbox=${encodeURIComponent(viewbox)}&bounded=1`;
    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data.map(d => normalizeToOption(d, "nominatim")) : [];
  };

  const fetchBAN = async (query, parts) => {
    const base = "https://api-adresse.data.gouv.fr/search/";
    const params = new URLSearchParams({ limit: "10", autocomplete: "1" });
    params.set("q", parts?.street || query);
    if (parts?.postcode) params.set("postcode", parts.postcode);
    const res = await fetch(`${base}?${params.toString()}`);
    const data = await res.json();
    const feats = Array.isArray(data?.features) ? data.features : [];
    return feats.map(f => normalizeToOption(f, "ban"));
  };

  const fetchAddresses = async (query) => {
    if (!query || query.length < minLength) return setOptions([]);
    setLoading(true);
    const parts = parseAddressParts(query);
    try {
      let results = await fetchBAN(query, parts); // priorité BAN France
      if ((!results || results.length === 0) && countrycodes?.toLowerCase() !== "fr") {
        results = await fetchNominatim(query, parts);
      }
      setOptions(results || []);
    } catch (e) {
      console.error(e);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (_evt, newInputValue) => {
    setInputValue(newInputValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!newInputValue || newInputValue.trim().length === 0) return setOptions([]);
    debounceRef.current = setTimeout(() => fetchAddresses(newInputValue), debounceMs);
  };

  return (
    <Autocomplete
      freeSolo
      loading={loading}
      options={options}
      filterOptions={(x) => x} // pas de filtrage client
      getOptionLabel={(option) => typeof option === "string" ? option : option?.display_name || ""}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={(_e, newValue) => {
        if (newValue) {
          const label = typeof newValue === "string" ? newValue : newValue.display_name || "";
          setInputValue(label);
          onChange?.(newValue);
        } else {
          setInputValue("");
          onChange?.(null);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Adresse"
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          placeholder="Ex: 69200, 7 Rue du parc"
        />
      )}
    />
  );
}
