<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function(){
   Route::prefix('blocks')->group(function(){
       Route::get('/', 'BlockController@index');
       Route::get('/{height}', 'BlockController@show')->where('height', '[0-9]+');
       Route::get('/latest', 'BlockController@latest');
   });

   Route::prefix('transactions')->group(function(){
       Route::get('/', 'TransactionController@index');
       Route::get('/{hash}', 'TransactionController@show');
   });

   Route::prefix('accounts')->group(function(){
       Route::get('/{address}', 'AccountController@show');
   });

   Route::prefix('search')->group(function(){
       Route::post('/', 'SearchController@search');
   });

   Route::prefix('migration')->group(function(){
       Route::post('/', 'MigrationController@store');
       Route::get('/{reference}', 'MigrationController@show');
   });
});
