"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SentIcon, StarIcon, Loading03Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitFeedbackAction, SubmitFeedbackInput } from "@/appwrite/submitFeedbackAction"
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type FeedbackCategory = 'bug_report' | 'feature_request' | 'general' | 'complaint'

const categoryLabels: Record<FeedbackCategory, string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  general: 'General Feedback',
  complaint: 'Complaint',
}

export function FeedbackModal() {
  const [open, setOpen] = React.useState(false)
  const [category, setCategory] = React.useState<FeedbackCategory | ''>('')
  const [rating, setRating] = React.useState<number>(0)
  const [feedbackText, setFeedbackText] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')

  const resetForm = () => {
    setCategory('')
    setRating(0)
    setFeedbackText('')
    setErrorMessage('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Delay reset to allow close animation to complete
      setTimeout(() => {
        resetForm()
      }, 150)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!category || rating === 0 || !feedbackText.trim()) {
      setErrorMessage('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const input: SubmitFeedbackInput = {
      category: category as FeedbackCategory,
      rating,
      feedback_text: feedbackText.trim(),
    }

    const result = await submitFeedbackAction(input)

    setIsSubmitting(false)

    if (result.success) {
      setOpen(false)  // Close immediately on success
    } else {
      setErrorMessage(result.message || 'Failed to submit feedback')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <SidebarMenuItem>
        <DialogTrigger asChild>
          <SidebarMenuButton size="sm">
            <HugeiconsIcon icon={SentIcon} />
            <span>Feedback</span>
          </SidebarMenuButton>
        </DialogTrigger>
      </SidebarMenuItem>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts with us. Your feedback helps us improve the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as FeedbackCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <HugeiconsIcon
                    icon={StarIcon}
                    className={`size-6 ${
                      star <= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                    fill={star <= rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
