import React from 'react';

/**
 * BadgeShelf component – displays a list of badges earned by a student.
 * Expects `badges` prop to be an array of objects with at least `id` and `name`.
 * If the array is empty, a friendly placeholder is shown.
 */
export default function BadgeShelf({ badges }) {
  if (!badges || badges.length === 0) {
    return <p className="text-muted">No badges earned yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.id}
          className="px-3 py-1 bg-accent-color text-black rounded-full text-sm font-medium"
        >
          {badge.name}
        </span>
      ))}
    </div>
  );
}
