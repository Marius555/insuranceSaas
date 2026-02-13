"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon, Loading03Icon, SentIcon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitFeedbackAction } from "@/appwrite/submitFeedbackAction"

interface ReportFeedbackButtonProps {
  reportId: string
}

export function ReportFeedbackButton({ reportId }: ReportFeedbackButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [rating, setRating] = React.useState<number>(0)
  const [feedbackText, setFeedbackText] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const resetForm = () => {
    setRating(0)
    setFeedbackText("")
    setErrorMessage("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        resetForm()
      }, 150)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0 || !feedbackText.trim()) {
      setErrorMessage("Please provide a rating and feedback text")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    const result = await submitFeedbackAction({
      report_id: reportId,
      category: "general",
      rating,
      feedback_text: feedbackText.trim(),
    })

    setIsSubmitting(false)

    if (result.success) {
      setOpen(false)
    } else {
      setErrorMessage(result.message || "Failed to submit feedback")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="p-4.5">
          <HugeiconsIcon icon={SentIcon} size={16} />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Feedback</DialogTitle>
          <DialogDescription>
            How was your experience with this report? Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
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
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground"
                    }`}
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="report-feedback">Your Feedback</Label>
            <Textarea
              id="report-feedback"
              placeholder="Tell us about your experience with this report..."
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
              {isSubmitting && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
