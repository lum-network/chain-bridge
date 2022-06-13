import { Exclude, Expose, Type } from 'class-transformer';
import { BalanceResponse } from '@app/http';

@Exclude()
class ProductsReviewsContentResponse {
    @Expose({ name: 'cons' })
    cons: string;

    @Expose({ name: 'overall' })
    overall: string;

    @Expose({ name: 'pros' })
    pros: string;
}

@Exclude()
class ProductsReviewsRatingsResponse {
    @Expose({ name: 'overall' })
    overall: number;

    @Expose({ name: 'quality' })
    quality: number;
}

@Exclude()
class ProductsReviewsProductResponse {
    @Expose({ name: 'name' })
    name: string;

    @Expose({ name: 'url' })
    url: string;

    @Expose({ name: 'urls' })
    urls: string[];

    @Expose({ name: 'ids' })
    ids: {
        asins: string[];
        gtins: string[];
        mpns: string[];
        skus: string[];
    };
}

@Exclude()
class ProductsReviewsResponse {
    @Expose({ name: 'collectionMethod' })
    collection_method: string;

    @Expose({ name: 'orderId' })
    order_id: string;

    @Expose({ name: 'ratingUrl' })
    rating_url: string;

    @Expose({ name: 'reviewId' })
    review_id: string;

    @Expose({ name: 'reviewUrl' })
    review_url: string;

    @Expose({ name: 'timestamp' })
    timestamp: string;

    @Expose({ name: 'title' })
    title: string;

    @Expose({ name: 'content' })
    @Type(() => ProductsReviewsContentResponse)
    content: ProductsReviewsContentResponse;

    @Expose({ name: 'ratings' })
    @Type(() => ProductsReviewsRatingsResponse)
    ratings: ProductsReviewsRatingsResponse;

    @Expose({ name: 'products' })
    @Type(() => ProductsReviewsProductResponse)
    products: ProductsReviewsProductResponse[];
}

@Exclude()
class RewardDetailsResponse {
    @Expose({ name: 'amount' })
    amount: number;

    @Expose({ name: 'maxAmount' })
    max_amount: number;

    @Expose({ name: 'status' })
    status: string;

    @Expose({ name: 'type' })
    type: string;
}

@Exclude()
class RewardResponse {
    @Expose({ name: 'amount' })
    amount: number;

    @Expose({ name: 'currency' })
    currency: string;

    @Expose({ name: 'maxAmount' })
    max_amount: number;

    @Expose({ name: 'status' })
    status: string;

    @Expose({ name: 'trigger' })
    trigger: string;

    @Expose({ name: 'details' })
    @Type(() => RewardDetailsResponse)
    details: RewardDetailsResponse[];
}

@Exclude()
class MerchantReviewContentResponse {
    @Expose({ name: 'customerService' })
    customer_service: string;

    @Expose({ name: 'overall' })
    overall: string;
}

@Exclude()
class MerchantReviewRatingsResponse {
    @Expose({ name: 'overall' })
    overall: number;

    @Expose({ name: 'nps' })
    nps: number;

    @Expose({ name: 'customerService' })
    customer_service: number;
}

@Exclude()
class MerchantReviewResponse {
    @Expose({ name: 'collectionMethod' })
    collection_method: string;

    @Expose({ name: 'merchantUrl' })
    merchant_url: string;

    @Expose({ name: 'orderId' })
    order_id: string;

    @Expose({ name: 'ratingUrl' })
    rating_url: string;

    @Expose({ name: 'reviewId' })
    review_id: string;

    @Expose({ name: 'reviewUrl' })
    review_url: string;

    @Expose({ name: 'timestamp' })
    timestamp: string;

    @Expose({ name: 'title' })
    title: string;

    @Expose({ name: 'content' })
    @Type(() => MerchantReviewContentResponse)
    content: MerchantReviewContentResponse;

    @Expose({ name: 'ratings' })
    @Type(() => MerchantReviewRatingsResponse)
    ratings: MerchantReviewRatingsResponse;
}

@Exclude()
class DataResponse {
    @Expose({ name: 'productsReviews' })
    @Type(() => ProductsReviewsResponse)
    products_reviews: ProductsReviewsResponse[];

    @Expose({ name: 'reward' })
    @Type(() => RewardResponse)
    reward: RewardResponse;

    @Expose({ name: 'merchantReview' })
    @Type(() => MerchantReviewResponse)
    merchant_review: MerchantReviewResponse;
}

@Exclude()
export class BeamResponse {
    @Expose({ name: 'amount' })
    amount: BalanceResponse;

    @Expose({ name: 'cancelReason' })
    cancel_reason: string;

    @Expose({ name: 'claimAddress' })
    claim_address: string;

    @Expose({ name: 'claimExpiresAtBlock' })
    claim_expires_at_block: number;

    @Expose({ name: 'claimed' })
    claimed: boolean;

    @Expose({ name: 'closeAt' })
    close_at: string;

    @Expose({ name: 'closesAtBlock' })
    closes_at_block: number;

    @Expose({ name: 'createdAt' })
    created_at: string;

    @Expose({ name: 'creatorAddress' })
    creator_address: string;

    @Expose({ name: 'fundsWithdrawn' })
    funds_withdrawn: boolean;

    @Expose({ name: 'hideContent' })
    hide_content: boolean;

    @Expose({ name: 'id' })
    id: string;

    @Expose({ name: 'schema' })
    schema: string;

    @Expose({ name: 'secret' })
    secret: string;

    @Expose({ name: 'status' })
    status: number;

    @Expose({ name: 'data' })
    @Type(() => DataResponse)
    data: DataResponse;
}
