import { use } from 'react';
import AssetDetailClient from './AssetDetailClient';

export default function AssetDetailPage({ params }) {
    const { type } = use(params);
    return <AssetDetailClient type={type} />;
}
