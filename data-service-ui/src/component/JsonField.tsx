import React from "react";

interface JsonFieldProps {
  record?: any;
  maxLength: number;
  source: string;
}

// Field for displaying potentially long JSON data.
export const JsonField = (props: JsonFieldProps) => {
  const { record, maxLength, source } = props;
  const json = record[source];
  if (!record || !json) {
    return null;
  }
  const data = JSON.stringify(json);
  return (
    <div>
      {data.length > maxLength ? data.slice(0, maxLength - 3) + "..." : data}
    </div>
  );
};
