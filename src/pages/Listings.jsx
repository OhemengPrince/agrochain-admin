import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import {
  getMarketplaceListings,
  deleteMarketplaceListing,
  getProduceBatches,
  deleteProduceBatch,
  getEquipmentListings,
  deleteEquipmentListing,
} from '../api/admin';
import { extractArray, formatGHS, formatDate } from '../utils/format';

const TABS = [
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'produce', label: 'Produce Batches' },
  { key: 'equipment', label: 'Equipment' },
];

function useListingTab(key, loaders) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await loaders.get();
      setItems(extractArray(data));
      setLoaded(true);
    } catch {
      setError(`Could not load ${key}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return { items, setItems, loading, error, loaded, load };
}

export default function Listings() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [confirmTarget, setConfirmTarget] = useState(null); // { tab, item }
  const [deletingId, setDeletingId] = useState(null);

  const marketplace = useListingTab('marketplace listings', { get: getMarketplaceListings });
  const produce = useListingTab('produce batches', { get: getProduceBatches });
  const equipment = useListingTab('equipment', { get: getEquipmentListings });

  const tabState = { marketplace, produce, equipment }[activeTab];

  useEffect(() => {
    if (!tabState.loaded && !tabState.loading) {
      tabState.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const requestDelete = (item) => setConfirmTarget({ tab: activeTab, item });

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const { tab, item } = confirmTarget;
    const state = { marketplace, produce, equipment }[tab];
    const remover =
      tab === 'marketplace' ? deleteMarketplaceListing : tab === 'produce' ? deleteProduceBatch : deleteEquipmentListing;

    setDeletingId(item.id);
    try {
      await remover(item.id);
      state.setItems((prev) => prev.filter((i) => i.id !== item.id));
      setConfirmTarget(null);
    } catch {
      // Keep dialog open with an inline note if the delete fails.
      setConfirmTarget((prev) => (prev ? { ...prev, failed: true } : prev));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Listings">
      <div className="mb-5 flex gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-sm sm:inline-flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabState.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tabState.error}
        </div>
      )}

      {activeTab === 'marketplace' && (
        <ListingTable
          loading={marketplace.loading}
          items={marketplace.items}
          emptyLabel="No marketplace listings found."
          columns={['Title', 'Category', 'Seller', 'Price', 'Status', 'Created']}
          renderRow={(l) => (
            <>
              <td className="px-5 py-3.5 font-medium text-gray-900">{l.title || l.name || '—'}</td>
              <td className="px-5 py-3.5 text-gray-600">{l.category || l.type || '—'}</td>
              <td className="px-5 py-3.5 text-gray-600">{l.sellerName || l.ownerName || '—'}</td>
              <td className="px-5 py-3.5 font-semibold text-gray-900">{formatGHS(l.price)}</td>
              <td className="px-5 py-3.5">
                <StatusBadge status={l.status} />
              </td>
              <td className="px-5 py-3.5 text-gray-500">{formatDate(l.createdAt)}</td>
            </>
          )}
          onDelete={requestDelete}
          deletingId={deletingId}
        />
      )}

      {activeTab === 'produce' && (
        <ListingTable
          loading={produce.loading}
          items={produce.items}
          emptyLabel="No produce batches found."
          columns={['Crop', 'Farmer', 'Quantity', 'Status', 'Created']}
          renderRow={(b) => (
            <>
              <td className="px-5 py-3.5 font-medium text-gray-900">{b.cropName || b.crop || '—'}</td>
              <td className="px-5 py-3.5 text-gray-600">{b.farmerName || b.farmer?.fullName || '—'}</td>
              <td className="px-5 py-3.5 text-gray-600">
                {b.quantity ? `${b.quantity} ${b.unit || ''}`.trim() : '—'}
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge status={b.status} />
              </td>
              <td className="px-5 py-3.5 text-gray-500">{formatDate(b.createdAt)}</td>
            </>
          )}
          onDelete={requestDelete}
          deletingId={deletingId}
        />
      )}

      {activeTab === 'equipment' && (
        <ListingTable
          loading={equipment.loading}
          items={equipment.items}
          emptyLabel="No equipment listings found."
          columns={['Name', 'Category', 'Owner', 'Price / Day', 'Status', 'Created']}
          renderRow={(e) => (
            <>
              <td className="px-5 py-3.5 font-medium text-gray-900">{e.name || e.title || '—'}</td>
              <td className="px-5 py-3.5 text-gray-600">{e.category || '—'}</td>
              <td className="px-5 py-3.5 text-gray-600">{e.ownerName || e.owner?.fullName || '—'}</td>
              <td className="px-5 py-3.5 font-semibold text-gray-900">{formatGHS(e.pricePerDay || e.price)}</td>
              <td className="px-5 py-3.5">
                <StatusBadge status={e.status} />
              </td>
              <td className="px-5 py-3.5 text-gray-500">{formatDate(e.createdAt)}</td>
            </>
          )}
          onDelete={requestDelete}
          deletingId={deletingId}
        />
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Remove this listing?"
        message={
          confirmTarget?.failed
            ? 'The last attempt failed. Try again, or cancel.'
            : 'This removes it from the marketplace for all users. This cannot be undone.'
        }
        confirmLabel="Remove Listing"
        danger
        loading={deletingId === confirmTarget?.item?.id}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </Layout>
  );
}

function ListingTable({ loading, items, emptyLabel, columns, renderRow, onDelete, deletingId }) {
  const colCount = columns.length + 1;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="text-xs uppercase tracking-wide text-gray-400">
              {columns.map((c) => (
                <th key={c} className="px-5 py-3 font-semibold">
                  {c}
                </th>
              ))}
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={colCount} className="px-5 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-5 py-8 text-center text-gray-400">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60">
                  {renderRow(item)}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onDelete(item)}
                      disabled={deletingId === item.id}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.id ? '…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
