import React from 'react';
import { useTheme2 } from '@grafana/ui';

interface PopupProps {
  coordinate: [number, number] | null;
  content: React.ReactNode | null; // Adjust to accept JSX elements
}

const Popup: React.FC<PopupProps> = ({ coordinate, content }) => {
  const theme = useTheme2();

  if (!coordinate || !content) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(-50%, 30%)',
        left: `${coordinate[0]}px`,
        top: `${coordinate[1]}px`,
        backgroundColor: theme.colors.background.primary,
        color: theme.colors.text.primary,
        padding: '10px',
        border: `1px solid ${theme.colors.border.strong}`,
        borderRadius: theme.shape.radius.default,
        pointerEvents: 'none',
        minHeight: '50px',
        maxWidth: '300px',
        overflowWrap: 'break-word',
      }}
    >
      {content}
    </div>
  );
};

export default Popup;
