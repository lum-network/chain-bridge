<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSatMigrationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sat_migrations', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('reference')->unique();

            $table->enum('state', ['WAITING', 'SUCCESS', 'REFUSED']);
            $table->string('message')->nullable();

            $table->string('from_address');
            $table->string('to_address');

            $table->text('tx_hash')->nullable();

            $table->integer('amount');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('sat_migration');
    }
}
