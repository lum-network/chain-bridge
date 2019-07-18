<?php

namespace App\Console\Commands;

use App\Jobs\BlocksSync;
use Illuminate\Console\Command;

class SyncBlock extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'explorer:block:sync {height}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync a given block';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $height = $this->argument('height');

        BlocksSync::dispatch($height, $height);
    }
}
