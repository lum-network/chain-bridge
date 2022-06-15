import {ApiProperty} from "@nestjs/swagger";

import {Exclude, Expose, Type} from "class-transformer";
import {BalanceResponse} from "@app/http/responses/balance.response";

@Exclude()
class ProductsReviewsContentResponse {
    @Expose()
    cons: string;

    @Expose()
    overall: string;

    @Expose()
    pros: string;
}

@Exclude()
class ProductsReviewsRatingsResponse {
    @Expose()
    overall: number;

    @Expose()
    quality: number;
}

@Exclude()
class ProductsReviewsProductResponse {
    @Expose()
    name: string;

    @Expose()
    url: string;

    @Expose()
    urls: string[];

    @Expose()
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

    @Expose()
    timestamp: string;

    @Expose()
    title: string;

    @Expose()
    @Type(() => ProductsReviewsContentResponse)
    content: ProductsReviewsContentResponse;

    @Expose()
    @Type(() => ProductsReviewsRatingsResponse)
    ratings: ProductsReviewsRatingsResponse;

    @Expose()
    @Type(() => ProductsReviewsProductResponse)
    products: ProductsReviewsProductResponse[];
}

@Exclude()
class RewardDetailsResponse {
    @Expose()
    amount: number;

    @Expose({ name: 'maxAmount' })
    max_amount: number;

    @Expose()
    status: string;

    @Expose()
    type: string;
}

@Exclude()
class RewardResponse {
    @Expose()
    amount: number;

    @Expose()
    currency: string;

    @Expose({ name: 'maxAmount' })
    max_amount: number;

    @Expose()
    status: string;

    @Expose()
    trigger: string;

    @Expose()
    @Type(() => RewardDetailsResponse)
    details: RewardDetailsResponse[];
}

@Exclude()
class MerchantReviewContentResponse {
    @Expose({ name: 'customerService' })
    customer_service: string;

    @Expose()
    overall: string;
}

@Exclude()
class MerchantReviewRatingsResponse {
    @Expose()
    overall: number;

    @Expose()
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

    @Expose()
    timestamp: string;

    @Expose()
    title: string;

    @Expose()
    @Type(() => MerchantReviewContentResponse)
    content: MerchantReviewContentResponse;

    @Expose()
    @Type(() => MerchantReviewRatingsResponse)
    ratings: MerchantReviewRatingsResponse;
}

@Exclude()
class DataResponse {
    @Expose({ name: 'productsReviews' })
    @Type(() => ProductsReviewsResponse)
    products_reviews: ProductsReviewsResponse[];

    @Expose()
    @Type(() => RewardResponse)
    reward: RewardResponse;

    @Expose({ name: 'merchantReview' })
    @Type(() => MerchantReviewResponse)
    merchant_review: MerchantReviewResponse;
}

@Exclude()
export class BeamResponse {
    @ApiProperty()
    @Expose({name: 'creatorAddress'})
    creator_address: string;

    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    status: number;

    @ApiProperty()
    @Expose()
    secret: string;

    @ApiProperty()
    @Expose({name: 'claimAddress'})
    claim_address: string;

    @ApiProperty()
    @Expose({name: 'fundsWithdrawn'})
    funds_withdrawn: boolean;

    @ApiProperty()
    @Expose()
    claimed: boolean;

    @ApiProperty()
    @Expose({name: 'cancelReason'})
    cancel_reason: string;

    @ApiProperty()
    @Expose({name: 'hideContent'})
    hide_content: boolean;

    @ApiProperty()
    @Expose()
    schema: string;

    @ApiProperty()
    @Expose({name: 'claimExpiresAtBlock'})
    claim_expires_at_block: number;

    @ApiProperty()
    @Expose({name: 'closesAtBlock'})
    closes_at_block: number;

    @ApiProperty({type: () => BalanceResponse})
    @Expose()
    @Type(() => BalanceResponse)
    amount: BalanceResponse;

    @ApiProperty()
    @Expose()
    @Type(() => DataResponse)
    data: DataResponse;

    @ApiProperty()
    @Expose({name: 'createdAt'})
    created_at: Date;

    @ApiProperty()
    @Expose({name: 'closed_at'})
    closed_at: Date;
}
