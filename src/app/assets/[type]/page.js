import AssetDetailClient from './AssetDetailClient';

export default function AssetDetailPage({ params }) {
    const { type } = params;
    return <AssetDetailClient type={type} />;
}
