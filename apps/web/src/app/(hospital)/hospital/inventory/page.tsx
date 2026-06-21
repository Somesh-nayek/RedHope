'use client';

import { FormEvent, useState } from 'react';
import { PackageOpen, Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  BloodGroup,
  HospitalInventory,
  useCreateInventory,
  useDeleteInventory,
  useHospitalInventory,
  useUpdateInventory
} from '@/lib/hospital-api';
import { formatBloodGroup } from '@/lib/formatters';

const bloodGroups: BloodGroup[] = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE'
];

export default function HospitalInventoryPage() {
  const inventory = useHospitalInventory();
  const createInventory = useCreateInventory();
  const updateInventory = useUpdateInventory();
  const deleteInventory = useDeleteInventory();
  const [editing, setEditing] = useState<HospitalInventory | null>(null);
  const [form, setForm] = useState({
    bloodGroup: 'O_POSITIVE' as BloodGroup,
    unitsAvailable: '0',
    criticalThreshold: '5'
  });

  function resetForm() {
    setEditing(null);
    setForm({ bloodGroup: 'O_POSITIVE', unitsAvailable: '0', criticalThreshold: '5' });
  }

  function startEdit(item: HospitalInventory) {
    setEditing(item);
    setForm({
      bloodGroup: item.bloodGroup,
      unitsAvailable: String(item.unitsAvailable),
      criticalThreshold: String(item.criticalThreshold)
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      bloodGroup: form.bloodGroup,
      unitsAvailable: Number(form.unitsAvailable),
      criticalThreshold: Number(form.criticalThreshold)
    };

    if (editing) {
      await updateInventory.mutateAsync({ id: editing.id, payload });
    } else {
      await createInventory.mutateAsync(payload);
    }
    resetForm();
  }

  const mutationError =
    createInventory.error || updateInventory.error || deleteInventory.error || null;

  return (
    <PageContainer
      title="Blood Inventory"
      description="Track hospital blood units and critical stock thresholds."
    >
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Edit Inventory' : 'Create Inventory'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="bloodGroup">
                  Blood Group
                </label>
                <select
                  id="bloodGroup"
                  value={form.bloodGroup}
                  disabled={Boolean(editing)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bloodGroup: event.target.value as BloodGroup
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  {bloodGroups.map((bloodGroup) => (
                    <option key={bloodGroup} value={bloodGroup}>
                      {formatBloodGroup(bloodGroup)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="unitsAvailable">
                  Units
                </label>
                <Input
                  id="unitsAvailable"
                  type="number"
                  min={0}
                  value={form.unitsAvailable}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unitsAvailable: event.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="criticalThreshold">
                  Critical Threshold
                </label>
                <Input
                  id="criticalThreshold"
                  type="number"
                  min={0}
                  value={form.criticalThreshold}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, criticalThreshold: event.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={createInventory.isPending || updateInventory.isPending}
                >
                  <Plus className="mr-2 size-4" />
                  {editing ? 'Save' : 'Create'}
                </Button>
                {editing ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {inventory.isLoading ? <LoadingState label="Loading inventory..." /> : null}
          {inventory.error ? <ErrorState message={inventory.error.message} /> : null}
          {mutationError ? <ErrorState message={mutationError.message} /> : null}
          {inventory.data?.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No inventory records"
              description="Create inventory records for each blood group your hospital tracks."
            />
          ) : null}
          {inventory.data?.length ? (
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Critical Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-primary">
                        {formatBloodGroup(item.bloodGroup)}
                      </TableCell>
                      <TableCell>{item.unitsAvailable}</TableCell>
                      <TableCell>{item.criticalThreshold}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === 'LOW_STOCK'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.status === 'LOW_STOCK' ? 'Low stock' : 'OK'}
                        </span>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteInventory.isPending}
                          onClick={() => deleteInventory.mutate(item.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
