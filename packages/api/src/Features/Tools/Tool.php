<?php

declare(strict_types=1);

namespace App\Features\Tools;

/**
 * Tool domain entity.
 *
 * Maps to the TOOL table in the database schema + fields the UI needs.
 */
final class Tool
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $logo,
        public readonly string $tagline,
        public readonly string $category,
        public readonly string $pricing,
        public readonly string $platform,
        public readonly int    $usageCount,
        public readonly float  $rating,
        public readonly string $primaryUseCase,
        public readonly int    $reviewCount = 0,
        public readonly int    $voteCount = 0,
        public readonly ?string $url = null,
        public readonly ?string $description = null,
        public readonly string $status = 'active',
        public readonly ?float  $externalRating = null,
        public readonly ?int    $externalRatingCount = null,
        public readonly ?string $externalRatingSource = null,
    ) {}

    public function toArray(): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'logo'          => $this->logo,
            'tagline'       => $this->tagline,
            'category'      => $this->category,
            'pricing'       => $this->pricing,
            'platform'      => $this->platform,
            'usageCount'    => $this->usageCount,
            'rating'        => $this->rating,
            'reviewCount'   => $this->reviewCount,
            'voteCount'     => $this->voteCount,
            'primaryUseCase'=> $this->primaryUseCase,
            'url'           => $this->url,
            'description'   => $this->description,
            'status'        => $this->status,
            'externalRating'       => $this->externalRating,
            'externalRatingCount'  => $this->externalRatingCount,
            'externalRatingSource' => $this->externalRatingSource,
        ];
    }
}
