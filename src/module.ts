import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';
import { mappedData } from './components/MenuPane';
import { ColorValueEditor } from './editors/ColorValueEditor';
import DataUnitsEditor from './editors/DataUnitsEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  // Creating dropdown options from mappedData directly within the addSelect method
  const categoryMapLayer = ['Map Layer'];
  const categoryMainPanel = ['Main Panel'];
  const categoryColor = ['Color Scheme'];
  const categoryData = ['Sub-Panel'];

  builder.addSelect({
    category: categoryMapLayer,
    path: 'type',
    name: 'Map Layers',
    settings: {
      options: [
        { value: 'default', label: 'Default Map' },
        { value: 'XYZconfig', label: 'XYZ Tile Layer' },
      ],
    },
    defaultValue: 'default',
  })
  .addTextInput({
    category: categoryMapLayer,
    path: 'XYZurl',
    name: 'URL template',
    description: 'Must include {x}, {y} or {-y}, and {z} placeholders',
    defaultValue: '',
    settings:{
      placeholder: 'eg: https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    },
    showIf: (config) => config.type === 'XYZconfig',
  })
  .addBooleanSwitch({
    category: categoryMapLayer,
    path: 'zoomBoolean',
    name:'Customize zoom on map',
    description:'',
    defaultValue: false,
  })
  .addSliderInput({
    category: categoryMapLayer,
    path: 'zoomInd',
    name: 'Zoom Value',
    description: 'Initial zoom value for individual locations',
    settings: {
      min: 0,
      max: 20, 
    },
    defaultValue: 5,
    showIf: (config) => config.zoomBoolean === true,
  })
  .addTextInput({
    category: categoryMapLayer,
    path: 'pinText',
    name: 'Text color within pin',
    description: 'The color of the text inside the location pin.',
    defaultValue: '#FFF', 
    settings:{      
      placeholder: '#FFF',
    }
  })

  builder.addTextInput({
    category: categoryMainPanel,
    path: 'header',
    name: 'Header Text',
    description: 'Text to be displayed at the top in both main and sub-panels',
    defaultValue: 'DEVICES',
    settings:{
      placeholder: 'edit here',
    }
  })
  .addSelect({
    category: categoryMainPanel,
    path: 'dataKey',
    name: 'Parameter on Display',
    description: 'Select a parameter to display on main panel',
    settings: {
      options: Array.from(mappedData.entries()).map(([key, value]) => ({
        value: key, // Use the key as the value for select options
        label: key,
      })),
    },
  })
  .addUnitPicker({
    category: categoryMainPanel,
    path: 'unit',
    name: 'Units',
    description: 'Units to be displayed along with the values.',
    settings:{
      isClearable: true,
    }
  });

  builder.addCustomEditor({
    category: categoryColor,
    id: 'colorPairs',
    path: 'colorPairs',
    name: 'Color Scheme',
    description: 'Configure multiple color and value pairs',
    editor: ColorValueEditor, 
    defaultValue: [],
  })
  .addTextInput({
    category: categoryColor,
    path: 'defColor',
    name: 'Default Color',
    description: 'The color of the location pin and the corresponding value when color scheme is not implemented.',
    defaultValue: '#808080', 
    settings:{      
      placeholder: '#808080',
    }
  });

  builder.addCustomEditor({
    id: 'dataUnits',
    category: categoryData,
    path: 'dataUnits',
    name: 'Units Editor',
    description: 'Add units for data in the sub-panel',
    editor: DataUnitsEditor,
    defaultValue: {},
  });
});
