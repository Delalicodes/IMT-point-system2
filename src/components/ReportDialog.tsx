'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { Check } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
}

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
}

export default function ReportDialog({ isOpen, onClose, onSubmit }: ReportDialogProps) {
  const [content, setContent] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchTasks();
    }
  }, [isOpen, session?.user?.id]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      }
      return [...prev, taskId];
    });
  };

  const handleSubmit = async () => {
    if (selectedTasks.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one task',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedTasksDetails = tasks
        .filter(task => selectedTasks.includes(task.id))
        .map(task => `- ${task.title} (${task.status === 'COMPLETED' ? '✓' : 'In Progress'})`);

      const reportContent = `Progress Report:\n\nTasks:\n${selectedTasksDetails.join('\n')}${
        content.trim() ? `\n\nDetails:\n${content}` : ''
      }`;
      
      await onSubmit(reportContent);
      setContent('');
      setSelectedTasks([]);
      toast({
        title: 'Success',
        description: 'Report submitted successfully',
        variant: 'success',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Progress Report</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium">Select Tasks</h3>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tasks available</div>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-2 rounded-lg border p-2 cursor-pointer hover:bg-accent"
                    onClick={() => handleTaskSelect(task.id)}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      selectedTasks.includes(task.id) ? 'bg-primary border-primary' : 'border-input'
                    }`}>
                      {selectedTasks.includes(task.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{task.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    </div>
                    {task.status === 'COMPLETED' && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap">
                        Completed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium">Progress Details (Optional)</h3>
            <Textarea
              placeholder="Add any additional details about your progress..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
