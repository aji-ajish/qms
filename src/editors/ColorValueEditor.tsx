import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, PanelOptionsEditorProps } from '@grafana/data';
import { Button, ColorPicker, Input, useStyles2 } from '@grafana/ui';
import { SimpleOptions, ColorValuePair } from '../types';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    colorValueEditor: css({}),
    inputTab: css({
      margin: '0 20px',
      borderRadius: '8px',
    }),
    btnAdd: css({
      color: theme.colors.text.primary,
      background: theme.colors.background.secondary,
    }),
    btnDanger: css({
      color: theme.colors.text.primary,
      background: theme.colors.background.primary,
    }),
  };
};

export const ColorValueEditor: React.FC<PanelOptionsEditorProps<SimpleOptions>> = ({ value, onChange }) => {
  const styles = useStyles2(getStyles);
  // Ensure colorPairs is initialized
  const colorPairsList: ColorValuePair[] = value.colorPairs || [];

  const handleAddPair = () => {
    const newPair: ColorValuePair = { color: 'green', value: 0 };
    onChange({ ...value, colorPairs: [...colorPairsList, newPair] });
  };

  const handlePairChange = (index: number, key: keyof ColorValuePair, newValue: string) => {
    const newPairs = colorPairsList.slice();
    newPairs[index] = { ...newPairs[index], [key]: newValue };
    onChange({ ...value, colorPairs: newPairs });
  };

  const handleRemovePair = (index: number) => {
    const newPairs = colorPairsList.slice();
    newPairs.splice(index, 1);
    // if (newPairs.length === 0) {
    //   const newPair: ColorValuePair = {color:'', value:0};
    //   onChange({ ...value, colorPairs: [newPair] });
    // } else {
    onChange({ ...value, colorPairs: newPairs });
    // }
  };

  return (
    <div className={styles.colorValueEditor}>
      {colorPairsList.map((pair, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <ColorPicker color={pair.color} onChange={(color) => handlePairChange(index, 'color', color)} />
          <Input
            className={styles.inputTab}
            value={pair.value}
            onChange={(e) => handlePairChange(index, 'value', e.currentTarget.value)}
            placeholder="Value"
          />
          <Button variant="destructive" size="sm" className={styles.btnDanger} onClick={() => handleRemovePair(index)}>
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
      <Button className={styles.btnAdd} onClick={handleAddPair}>
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
        &nbsp; Add Color
      </Button>
    </div>
  );
};

export default ColorValueEditor;
