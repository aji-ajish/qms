import React, { useEffect, useState } from 'react';
import { DataFrame, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';

interface MenuPaneProps {
  data: DataFrame[];
  onMenuClick: (lat: number, lng: number, deviceid: string) => void;
  selectedDeviceId: string | undefined;
  dataKey?: string;
  unit?: any;
  expandCardDetail?: string | undefined;
  setExpandCardDetail: any;
  colorPairsList: any;
  onMapFitToData: (option: boolean) => void;
  headerText: string | undefined;
  dataUnits: Record<string, string>;
  defaultColor: string;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    card: css({
      background: theme.colors.background.primary,
      color: theme.colors.text.primary,
      boxShadow: theme.shadows.z2,
      marginBottom: '16px',
      overflow: 'hidden',
      cursor: 'pointer',
      borderRadius: '4px',
      paddingRight: '7px',
      borderLeft: '8px solid transparent',
    }),
    selectedCard: css({
      borderLeftColor: theme.colors.success.border,
      background: theme.colors.background.primary,
    }),

    spacer: css`
      padding: 8px 8px 10px;
    `,

    before: css`
      border-right: 1px solid #808080;
    `,
    subTitleFont: css`
      font-weight: 800;
    `,
    badge: css`
      padding: 5px;
      font-weight: 800;
      text-transform: capitalize;
      font-size: 12px;
      border-radius: 5px;
      margin: 0 8px;
    `,
    online: css`
      background: #00a36c;
      color: #fff;
    `,
    offline: css`
      background: #ff100a;
      color: #fff;
    `,
    deviceId: css({
      color: theme.colors.text.primary,
      fontSize: '24px',
      fontWeight: '500',
    }),
    displayData: css({
      color: theme.colors.text.primary,
      fontSize: '30px',
    }),

    alignCenter: css`
      display:flex;
      flex-direction:row;
      justify-content:center;
      align-items:center;
    `,
    displayDataValue: css({
      fontSize: '13px',
    }),
    content: css`
      padding: 0 8px;
    `,
    pb16: css`
      padding-bottom: 16px;
    `,
    button: css({
      color: theme.colors.text.maxContrast,
      background: theme.colors.background.secondary,
      margin: '10px ',
      border: theme.colors.border.medium,
      cursor: 'pointer',
      padding: '5px 10px',
    }),

    details: css`
      margin-top: 10px;
      position: relative;
    `,
    table: css`
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    `,
    tableCellAlert: css`
      border: 1px solid #ddd;
      padding: 8px;
    `,
    tableHeader: css({
      background: theme.colors.background.secondary,
      color: theme.colors.text.maxContrast,
    }),
    tableCell: css({
      borderBlock: '1px solid #ddd',
      padding: '8px',
    }),
    closeButton: css({
      background: theme.colors.background.secondary,
      color: theme.colors.text.maxContrast,
      border: '2px',
      padding: '5px 10px',
      borderRadius: '3px',
      cursor: 'pointer',


    }),
    zoomOut: css({
      background: theme.colors.background.secondary,
      color: theme.colors.text.secondary,
      border: '2px',
      padding: '2px 5px',
      borderRadius: '3px',
      cursor: 'pointer',
      position: 'absolute',
      top: '-30px',
      right: '26px',
    }),

    wrap: css`
      display: flex;
      padding: 10px 0;
      align-items: center;
      justify-content: space-evenly;
      border-top: 1px solid #808080;
      border-bottom: 1px solid #808080;
    `,
    title: css`
      font-weight:700;
    `,
    wrapgrp: css`
      display:flex;
      justify-content:space-between;
      align-items:center;
      `,

    sectWrap: css`
      display: flex;
    justify-content: space-between;`,
    butWrap: css`
    flex-direction: column;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;`,
  };
};

export const mappedData: Map<string, any> = new Map();

const MenuPane: React.FC<MenuPaneProps> = ({
  data,
  onMenuClick,
  selectedDeviceId,
  dataKey,
  unit,
  expandCardDetail,
  setExpandCardDetail,
  colorPairsList,
  onMapFitToData,
  headerText,
  dataUnits,
  defaultColor
}) => {
  const styles = useStyles2(getStyles);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);



  const handleCardExpansion = (index: number) => {
    setExpandedCardIndex(index);
  };

  const handleCardClose = () => {
    setExpandedCardIndex(null);
  };

  useEffect(() => {
    data.forEach((frame) => {
      const dataField = frame.fields.find((f) => f.name === 'data');
      if (dataField) {
        for (let i = 0; i < dataField.values.length; i++) {
          const parsedValue = JSON.parse(dataField.values[i]);
          Object.entries(parsedValue).forEach(([key, value]) => {
            mappedData.set(key, value);
          });
        }
      }
    });
  }, [data]);

  useEffect(() => {
    if (expandCardDetail) {
      data.forEach((frame, frameIndex) => {
        const deviceidField = frame.fields.find((f) => f.name === 'deviceid');
        deviceidField?.values.forEach((deviceid, i) => {
          if (deviceid === expandCardDetail) {
            setExpandedCardIndex(i);
            setExpandCardDetail()
          }
        });
      });
    }
  }, [expandCardDetail, data, setExpandCardDetail]);

  let colorArray: any = [];
  colorArray = colorPairsList.colorPairs;
  if (colorArray === null || colorArray === undefined) {
    colorArray = [];
    colorArray.push({ color: defaultColor, value: '0' });
  } else {
    setTimeout(() => {
      colorArray.sort((a: { value: number }, b: { value: number }) => a.value - b.value);
    }, 5000);
  }

  function getColor(unit: number): string {
    if (!colorArray || colorArray.length === 0) {
      return defaultColor || '#000000'; // Fallback to default color if colorArray is empty
    }

    for (let i = 0; i <= colorArray.length - 1; i++) {
      if (unit >= colorArray[i].value && (i + 1 === colorArray.length || unit < colorArray[i + 1].value)) {
        return colorArray[i].color;
      }
    }
    return defaultColor; // Default to the first color if no match is found
  }

  // Function to retrieve value from dataMap based on key
  function getValueFromDataMap(key: string, dataUnits: Record<string, string>): string | undefined {
    return dataUnits[key];
  }

  const convertTimestamp = (timestamp: any) => {
    const date = new Date(timestamp);

    const now = new Date();
    const diffInMs: number = now.getTime() - date.getTime(); // Use getTime() to get milliseconds
    const diffInHours: number = diffInMs / (1000 * 60 * 60); // Convert milliseconds to hours

    if (diffInHours <= 6) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.round(diffInMs / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
      }
      return `${Math.round(diffInHours)} hours ago`;
    }

    return date.toLocaleString();
  };

  function roundOff(num: number | string): string {
    if (typeof num === 'string') {
      return num; // Return as is if it's a string
    }
    // Check if there are decimals
    if (Number.isInteger(num)) {
      return num.toString(); // Return as integer if no decimals
    } else {
      return num.toFixed(2); // Round to two decimals if there are decimals
    }
  }


  return (
    <div className="menu-pane">
      {data.map((frame, frameIndex) => (
        <div key={frameIndex}>
          <h2 className={styles.title}>{headerText}</h2>
          {frame.fields[0].values.map((_, i) => {
            const latField = frame.fields.find((f) => f.name === 'lat');
            const lngField = frame.fields.find((f) => f.name === 'lng');
            const deviceidField = frame.fields.find((f) => f.name === 'deviceid');
            const receiveTimeStamp = frame.fields.find((f) => f.name === 'receive_timestamp');
            const dataField = frame.fields.find((f) => f.name === 'data');
            const alertsInfo = frame.fields.find((f) => f.name === 'alerts_info');
            const deviceStatusField = frame.fields.find((f) => f.name === 'device_status');

            const parsedData = dataField ? JSON.parse(dataField.values[i]) : {};
            const alertsInfoParsedData = alertsInfo ? JSON.parse(alertsInfo.values[i]) : {};
            const receiveTimeParsedData = receiveTimeStamp ? JSON.parse(receiveTimeStamp.values[i]) : {};
            const deviceStatus = deviceStatusField ? deviceStatusField.values[i] : 'Unknown';

            const isExpanded = i === expandedCardIndex;
            return (
              <div key={i}>
                {!isExpanded && expandedCardIndex === null && (
                  <div
                    className={`${styles.card} ${deviceidField?.values[i] === selectedDeviceId ? styles.selectedCard : ''
                      }`}
                    onClick={() => {
                      if (latField && lngField && deviceidField) {
                        onMenuClick(latField.values[i], lngField.values[i], deviceidField.values[i]);
                      }
                    }}
                  >
                    <div className={styles.spacer}>
                      <span className={styles.deviceId}>{deviceidField?.values[i]}</span>
                    </div>
                    <div className={styles.wrap}>
                      <div className={styles.spacer + ' ' + styles.before}>
                        <span className={styles.displayData + ' ' + styles.alignCenter}>
                          {dataKey ? (
                            <>
                              <span
                                style={{ color: deviceStatus === 'online' ? getColor(parsedData[dataKey]) : defaultColor, fontWeight: 'bold', fontSize: '50px', lineHeight: 'normal' }}
                              >
                                {' '}
                                {roundOff(parsedData[dataKey])}
                              </span>
                              <p style={{ paddingLeft: '15px', margin: '0', maxHeight: '60px', display: 'flex', flexDirection: 'column' }}>
                                <div className={styles.displayDataValue}>{unit}</div>
                                <span className={styles.displayDataValue}>Last updated: {convertTimestamp(receiveTimeParsedData)}</span>
                              </p>
                            </>
                          ) : (
                            <>
                              {parsedData.hsi} <span className={styles.displayDataValue}>hsi</span>
                            </>
                          )}
                        </span>
                      </div>
                      <svg fill={deviceStatus === 'online' && dataKey ? getColor(parsedData[dataKey]) : defaultColor}
                        id="Layer_1"
                        data-name="Layer 1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="75"
                        height="75"
                        viewBox="0 0 48 48">
                        <path d="M20,34a1.69,1.69,0,0,0,.27.9l.87,1.3a1.63,1.63,0,0,0,1.35.72h3.12a1.63,1.63,0,0,0,1.35-.72l.87-1.3a1.69,1.69,0,0,0,.27-.9V32.1H20Z" />
                        <path d="M24,11A8.9,8.9,0,0,0,17.3,25.81a14.78,14.78,0,0,1,2.64,4.63v0h8.12v0a14.78,14.78,0,0,1,2.64-4.63A8.8,8.8,0,0,0,32.91,20,8.9,8.9,0,0,0,24,11Zm0,4.86A4.06,4.06,0,0,0,20,20a.81.81,0,1,1-1.62,0A5.67,5.67,0,0,1,24,14.28a.81.81,0,0,1,0,1.62Z" /></svg>
                    </div>

                    <div className={styles.wrapgrp}>
                      <button
                        className={styles.button}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardExpansion(i);
                        }}
                      >
                        Show Details
                      </button>
                      <div className={styles.spacer}>
                        {deviceStatus === 'online' ? (
                          <span className={styles.badge + ' ' + styles.online}>{deviceStatus}</span>
                        ) : (
                          <span className={styles.badge + ' ' + styles.offline}>{deviceStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {isExpanded && (
                  <div className={styles.details}>
                    <div className={styles.sectWrap}>
                      <span className={styles.displayData}>
                        {dataKey ? (
                          <>
                            <span
                              style={{
                                color:
                                  deviceStatus === 'online' ? getColor(parsedData[dataKey]) : defaultColor,
                                fontWeight: 'bold',
                                fontSize: '50px',
                                marginRight: '7px',
                              }}
                            >
                              {roundOff(parsedData[dataKey])}
                            </span>
                            <span className={styles.displayDataValue}>{unit}</span>
                          </>
                        ) : (
                          <>
                            {parsedData.hsi} <span className={styles.displayDataValue}>hsi</span>
                          </>
                        )}
                      </span>
                      <div className={styles.butWrap}>
                        <button
                          className={styles.closeButton}
                          onClick={() => {
                            handleCardClose();
                            onMapFitToData(true);
                          }}
                        >
                          All Stations
                        </button>

                        <div className={styles.spacer} >
                          {deviceStatus === 'online' ? (
                            <span className={styles.badge + ' ' + styles.online}>{deviceStatus}</span>
                          ) : (
                            <span className={styles.badge + ' ' + styles.offline}>{deviceStatus}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Display details in table view */}
                    <table className={styles.table}>
                      <thead>
                        {/* <tr className={styles.tableHeader}>
                          <th className={styles.tableCell}>Parameters</th>
                          <th className={styles.tableCell}>Observations</th>
                        </tr> */}
                      </thead>
                      <tbody>
                        {Object.entries(parsedData).map(([key, val]) => {
                          if (key !== dataKey) {
                            let unitVal = getValueFromDataMap(key, dataUnits);
                            return (
                              <tr key={key}>
                                <td className={styles.tableCell}>{key}</td>
                                <td className={styles.tableCell}>{val as string} {unitVal}</td>
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </tbody>
                    </table>
                    <br />
                    <table className={styles.table}>
                      <thead>
                        <caption>Notifications</caption>
                        <tr className={styles.tableHeader}>

                          <th className={styles.tableCellAlert}>Alerts</th>
                          <th className={styles.tableCellAlert}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          alertsInfoParsedData
                            ? alertsInfoParsedData.map((alertText: string | any, index: number) => {
                              return (
                                <tr key={index}>
                                  <td className={styles.tableCellAlert}>{alertText.alerttext}</td>
                                  <td className={styles.tableCellAlert}>{alertText.creation_timestamp}</td>
                                </tr>
                              );
                            })
                            :

                            <td colSpan={2} className={styles.tableCellAlert}>No Alerts</td>
                        }
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MenuPane;
