import React from 'react';

// Field for displaying potentially long JSON data.
export const JsonField: React.FunctionComponent<{record: any, maxLength: number, source: string}> = (props) => {
    let {record, maxLength, source } = props;
    let data = record[source];
    return record ? (
        <span>{data.length > maxLength ? data.slice(0, maxLength - 3) + "..." : data}</span>
    ) : null;
};
