import React from 'react';

export default function StatusBadge({ status }) {
  let variant = 'badge';

  switch (status) {
    case 'PUBLISHED':
    case 'CONFIRMED':
    case 'SUCCESS':
      variant = 'badge badge-emerald';
      break;
    case 'CHECKED_IN':
      variant = 'badge badge-white';
      break;
    case 'DRAFT':
    case 'PENDING':
    case 'PAYMENT_PENDING':
      variant = 'badge badge-amber';
      break;
    case 'REGISTRATION_CLOSED':
    case 'COMPLETED':
      variant = 'badge';
      break;
    case 'CANCELLED':
    case 'PAYMENT_FAILED':
    case 'REFUNDED':
      variant = 'badge badge-rose';
      break;
    default:
      break;
  }

  return (
    <span className={variant}>
      {status?.replace('_', ' ')}
    </span>
  );
}
