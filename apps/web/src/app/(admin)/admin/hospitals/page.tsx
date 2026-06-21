'use client';

import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDate } from '@/lib/formatters';
import {
  useAdminHospitals,
  useApproveHospital,
  useRejectHospital,
  type AdminHospital
} from '@/lib/admin-api';

export default function AdminHospitalsPage() {
  const hospitals = useAdminHospitals();
  const approveHospital = useApproveHospital();
  const rejectHospital = useRejectHospital();
  const [selected, setSelected] = useState<AdminHospital | null>(null);

  if (hospitals.isLoading) return <LoadingState label="Loading hospitals..." />;
  if (hospitals.isError) return <ErrorState message={hospitals.error.message} />;

  const data = hospitals.data ?? [];

  return (
    <PageContainer title="Hospitals" description="Review hospital registrations and approval status.">
      {data.length === 0 ? (
        <EmptyState icon={Building2} title="No hospitals found" description="Hospital registrations will appear here." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Approval Status</TableHead>
                  <TableHead>Counts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>
                      <div className="font-medium">{hospital.hospitalName}</div>
                      <div className="text-xs text-muted-foreground">{hospital.email}</div>
                    </TableCell>
                    <TableCell>{hospital.city}, {hospital.state}</TableCell>
                    <TableCell>
                      <span className={'rounded-full border px-2.5 py-1 text-xs font-medium ' + (hospital.approved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                        {hospital.approvalStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {hospital.counts.requests} requests • {hospital.counts.camps} camps
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelected(hospital)}>
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => approveHospital.mutate(hospital.id)} disabled={approveHospital.isPending || hospital.approved}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectHospital.mutate(hospital.id)} disabled={rejectHospital.isPending || !hospital.approved}>
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hospital Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-4 text-sm">
                  <Detail label="Name" value={selected.hospitalName} />
                  <Detail label="License" value={selected.licenseNumber} />
                  <Detail label="Contact" value={selected.contactNumber} />
                  <Detail label="Address" value={selected.address + ', ' + selected.city + ', ' + selected.state} />
                  <Detail label="User Status" value={selected.userStatus ?? 'Unknown'} />
                  <Detail label="Created" value={formatDate(selected.createdAt)} />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Metric label="Inventory" value={selected.counts.inventories} />
                    <Metric label="Requests" value={selected.counts.requests} />
                    <Metric label="Camps" value={selected.counts.camps} />
                    <Metric label="Donations" value={selected.counts.donations} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a hospital to review registration details.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
