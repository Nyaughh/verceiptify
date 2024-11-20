import React, { ReactNode } from 'react';

interface PaperBackgroundProps {
    children: ReactNode;
}

const PaperBackground: React.FC<PaperBackgroundProps> = ({ children }) => {
    return (
        <div style={paperStyle}>
            {children}
        </div>
    );
};

const paperStyle: React.CSSProperties = {
    backgroundColor: '#f5f5dc', // A light beige color
    backgroundImage: `
        linear-gradient(145deg, rgba(255, 255, 255, 0.6) 25%, transparent 25%),
        linear-gradient(225deg, rgba(255, 255, 255, 0.6) 25%, transparent 25%),
        linear-gradient(45deg, rgba(255, 255, 255, 0.6) 25%, transparent 25%),
        linear-gradient(315deg, rgba(255, 255, 255, 0.6) 25%, transparent 25%)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 10px 10px, 10px 0, 0 10px',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
    borderRadius: '5px', // Rounded corners
    minHeight: '100vh', // Full viewport height
    filter: 'contrast(0.9) brightness(1.1)', // Adjust contrast and brightness for effect
};

export default PaperBackground;
