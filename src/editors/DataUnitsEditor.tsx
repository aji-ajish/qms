import React, { useState, useEffect } from 'react';
import { Select, Button, Input, Field, FieldSet, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, StandardEditorProps } from '@grafana/data';
import { mappedData } from 'components/MenuPane';
import { css } from '@emotion/css';

interface DataUnitsEditorProps extends StandardEditorProps<Record<string, string>> {}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    btnAdd: css({
      color: theme.colors.text.primary,
      background: theme.colors.background.secondary,
      marginBottom:'10px',
    }),
    btnDanger: css({
      color: theme.colors.text.primary,
      background: theme.colors.background.primary,
      marginRight:'5px',

    }),
    outerSect:css({
     margin:'2px 0',
     display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    }),
  };
};

const DataUnitsEditor: React.FC<DataUnitsEditorProps> = ({ value, onChange }) => {
  const styles = useStyles2(getStyles);
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [dataMap, setDataMap] = useState<Record<string, string>>(value || {});

  useEffect(() => {
    // Initialize dataMap with value prop or an empty object if value is null or undefined
    setDataMap(value || {});
  }, [value]);

  const handleAddData = () => {
    if (selectedDataKey && inputValue && !dataMap[selectedDataKey]) {
      const updatedDataMap = { ...dataMap, [selectedDataKey]: inputValue };
      setDataMap(updatedDataMap);
      onChange(updatedDataMap);
      setSelectedDataKey(null);
      setInputValue('');
    }
  };

  const handleDeleteData = (key: string) => {
    const updatedDataMap = { ...dataMap };
    delete updatedDataMap[key];
    setDataMap(updatedDataMap);
    onChange(updatedDataMap);
  };

  const options = Array.from(mappedData.entries())
    .filter(([key]) => !dataMap[key]) // Filter out keys already in dataMap
    .map(([key]) => ({
      value: key,
      label: key,
    }));


  const displaySelectedOptions = () => {
    return (
      <div >
        {Object.entries(dataMap).map(([key, value]) => (
          <div key={key} className={styles.outerSect}>
            {key}: {value}{' '}
            <Button variant="destructive" size="sm" className={styles.btnDanger} onClick={() => handleDeleteData(key)}>
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <g id="icomoon-ignore"></g>
              <path d="M64 160v320c0 17.6 14.4 32 32 32h288c17.6 0 32-14.4 32-32v-320h-352zM160 448h-32v-224h32v224zM224 448h-32v-224h32v224zM288 448h-32v-224h32v224zM352 448h-32v-224h32v224z"></path>
              <path d="M424 64h-104v-40c0-13.2-10.8-24-24-24h-112c-13.2 0-24 10.8-24 24v40h-104c-13.2 0-24 10.8-24 24v40h416v-40c0-13.2-10.8-24-24-24zM288 64h-96v-31.599h96v31.599z"></path>
            </svg>
          </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <FieldSet>
      <Field label="Select Parameter">
        <Select
          options={options}
          value={selectedDataKey}
          onChange={(e) => setSelectedDataKey(e?.value ?? null)}
        />
      </Field>
      <Field label="Input Unit">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.currentTarget.value)}
        />
      </Field>
      <Button className={styles.btnAdd}  onClick={handleAddData}>
      <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width="7"
          height="7"
          viewBox="0 0 512 512"
          fill="currentColor"
        >
          <g id="icomoon-ignore"></g>
          <path d="M496 192h-176v-176c0-8.836-7.164-16-16-16h-96c-8.836 0-16 7.164-16 16v176h-176c-8.836 0-16 7.164-16 16v96c0 8.836 7.164 16 16 16h176v176c0 8.836 7.164 16 16 16h96c8.836 0 16-7.164 16-16v-176h176c8.836 0 16-7.164 16-16v-96c0-8.836-7.164-16-16-16z"></path>
        </svg>
        &nbsp; Add Unit</Button>
      {displaySelectedOptions()}
    </FieldSet>
  );
};

export default DataUnitsEditor;
