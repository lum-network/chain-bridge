<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AccountTest extends TestCase
{
    public function testShow()
    {
        $address = 'sand1ahgdmnyh92xfls7pd8fwwkjwsyvfvdv0seelfd';
        $response = $this->get('/api/v1/accounts/'.$address);

        $response->assertStatus(200);
        $response->assertJson(['result'=>[
            'address'   =>  $address
        ], 'code'=>200]);
    }

    public function testBadlyFormattedAddress()
    {
        $address = 'qlsndkjqsndkjnqskd123123';
        $response = $this->get('/api/v1/accounts/'.$address);

        $response->assertStatus(500);
    }

    public function testBadAddress()
    {
        $address = 'surprise1xr8vqhhvek3636kf463xwhxg6wvz920k84p5j2';
        $response = $this->get('/api/v1/accounts/'.$address);

        $response->assertStatus(500);
    }
}
