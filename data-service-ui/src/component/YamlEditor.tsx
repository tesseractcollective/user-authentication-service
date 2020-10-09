import React, { useState } from "react";
import Alert from '@material-ui/lab/Alert';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-github";

import yaml from "js-yaml";

import { useInput, useTranslate } from "ra-core";
import {
  FormControl, Typography, makeStyles,
} from "@material-ui/core";

const useStyles = makeStyles({
  alert: {
    margin: 8,
  }
});

export default (props: any) => {
  const {
    fullWidth = true,
    classes: classesOverride,
    helperText,
    label,
    source,
    resource,
    variant,
    margin = "dense",
    disabled = false,
    isJson = false,
    ...rest
  } = props;

  const {
    input: { value, onChange },
    meta: { touched },
  } = useInput({ source, ...rest });
  const classes = useStyles();
  const translate = useTranslate();

  const [yamlText, setYamlText] = useState(isJson && value ? yaml.safeDump(value) : value);
  const [error, setError] = useState<Error|undefined>(undefined);

  function onAceChange(newValue: any) {
    setYamlText(newValue);
    try {
      const json = yaml.safeLoad(newValue);
      if (isJson) {
        onChange(json);
      }
      setError(undefined);
    } catch (error) {
      setError(error);
    }

    if (!isJson) {
      onChange(newValue);
    }
  }

  return (
    <FormControl
      error={!!(touched && error)}
      fullWidth={fullWidth}
      className="ra-rich-text-input"
      margin={margin}
    >
      <Typography
        variant="caption"
        color="textSecondary"
        style={{ textTransform: "capitalize" }}
      >
        {source}
      </Typography>
      {error ? (
        <Alert severity="error" className={classes.alert}>{translate('luna.yamlEditor.invalidYaml', { error: error.message })}</Alert>
      ) : null}
      <AceEditor
        style={{ width: '100%' }}
        mode="yaml"
        theme="github"
        readOnly={disabled}
        editorProps={{ $blockScrolling: true }}
        value={yamlText}
        minLines={20}
        maxLines={40}
        onChange={onAceChange}
      />
    </FormControl>
  );
};
