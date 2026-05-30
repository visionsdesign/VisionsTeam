import React from 'react';

export default function Avatar({ initials, color, profilePicture, size, className = '' }) {
  const style = size ? { width: size, height: size, fontSize: size * 0.36 } : {};

  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt={initials}
        className={`avatar ${className}`.trim()}
        style={{ ...style, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      className={`avatar ${className}`.trim()}
      style={{ ...style, background: color }}
    >
      {initials}
    </div>
  );
}
