import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { reviewsAPI } from '@/lib/api';
import { Review } from '@/types';
import { formatDate } from '@/lib/utils';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await reviewsAPI.getAllReviews();
      if (response.success && response.data) {
        setReviews(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: string) => {
    try {
      const response = await reviewsAPI.updateReviewStatus(reviewId, status);
      if (response.success) {
        loadReviews();
      }
    } catch (error) {
      console.error('Failed to update review status:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews Management</h1>
        <p className="text-muted-foreground">Moderate and manage product reviews</p>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                      {review.user.firstName[0]}{review.user.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{review.user.firstName} {review.user.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{review.product.name}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {review.title && (
                    <h4 className="font-medium mb-2">{review.title}</h4>
                  )}
                  
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{formatDate(review.createdAt)}</span>
                    <span className={`px-2 py-1 rounded ${review.status === 'approved' ? 'bg-green-100 text-green-800' : review.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {review.status}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Verified Purchase</span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {review.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateReviewStatus(review.id, 'approved')}
                        className="text-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateReviewStatus(review.id, 'rejected')}
                        className="text-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{reviews.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold">{reviews.filter(r => r.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{reviews.filter(r => r.status === 'rejected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total Reviews</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 