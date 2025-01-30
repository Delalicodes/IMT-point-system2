'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Report {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isReport: boolean;
  approved: boolean | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    imageUrl?: string;
  };
  tasks?: {
    id: string;
    title: string;
    status: string;
  }[];
}

interface ReportNotificationProps {
  report: Report;
  onApprove: (reportId: string) => Promise<void>;
  onReject: (reportId: string) => Promise<void>;
}

export default function ReportNotification({ report, onApprove, onReject }: ReportNotificationProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAction = async (action: 'approve' | 'reject') => {
    try {
      setIsProcessing(true);
      if (action === 'approve') {
        await onApprove(report.id);
      } else {
        await onReject(report.id);
      }
      setIsOpen(false);
      toast({
        title: 'Success',
        description: `Report ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} report`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Report Submission</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm text-muted-foreground">
            From: {report.user.firstName} {report.user.lastName}
          </div>
          <div className="text-sm text-muted-foreground">
            Submitted: {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
          </div>
          <div className="mt-2 text-sm whitespace-pre-wrap">
            {report.content}
          </div>
          {report.tasks && report.tasks.length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-gray-700">Tasks:</h4>
              <div className="mt-1 space-y-1">
                {report.tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs text-gray-600">{task.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      task.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.status.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleAction('approve')}
            disabled={isProcessing}
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
