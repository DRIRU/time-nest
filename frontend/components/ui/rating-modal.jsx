"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function RatingModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  serviceTitle, 
  providerName,
  isSubmitting = false 
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      alert("Please select a rating")
      return
    }

    await onSubmit({
      rating,
      review: review.trim()
    })

    // Reset form
    setRating(0)
    setHoverRating(0)
    setReview("")
  }

  const handleClose = () => {
    setRating(0)
    setHoverRating(0)
    setReview("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Your Service Experience</DialogTitle>
          <DialogDescription>
            How was your experience with "{serviceTitle}" provided by {providerName}?
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="rating">Rating *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 rounded-sm hover:bg-gray-100 transition-colors"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && (
                  <span className="font-medium">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience with this service..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {review.length}/500 characters
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
