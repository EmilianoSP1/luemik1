<?php

namespace App\Http\Controllers\Sa;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UsersApiController extends Controller
{
    public function index(Request $r)
    {
        $q       = trim((string)$r->query('q', ''));
        $status  = (string)$r->query('status', '');
        $sort    = in_array($r->query('sort'), ['name','email','created_at']) ? $r->query('sort') : 'name';
        $dir     = $r->query('dir') === 'desc' ? 'desc' : 'asc';
        $perPage = min(max((int)$r->query('per_page', 10), 1), 100);

        $query = User::query();

        if ($q !== '') {
            $query->where(function ($x) use ($q) {
                $x->where('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%");
            });
        }

        // Filtro de estado
        if ($status === 'active') {
            if (Schema::hasColumn('users','disabled')) {
                $query->where(function ($x) {
                    $x->whereNull('disabled')->orWhere('disabled', 0);
                });
            }
            if (Schema::hasColumn('users','email_verified_at')) {
                $query->whereNotNull('email_verified_at');
            }
        } elseif ($status === 'inactive') {
            if (Schema::hasColumn('users','disabled')) {
                $query->where('disabled', 1);
            } else {
                if (Schema::hasColumn('users','email_verified_at')) {
                    $query->whereNull('email_verified_at');
                }
            }
        } elseif ($status === 'unverified') {
            if (Schema::hasColumn('users','email_verified_at')) {
                $query->whereNull('email_verified_at');
            } else {
                $query->whereRaw('1=0');
            }
        }

        if (! Schema::hasColumn('users', $sort)) {
            $sort = 'name';
        }

        $p = $query->orderBy($sort, $dir)->paginate($perPage)->withQueryString();

        $data = $p->getCollection()->map(function ($u) {
            $active = true;
            if (Schema::hasColumn('users','disabled')) {
                $active = ! (bool)($u->disabled ?? false);
            }
            if (Schema::hasColumn('users','email_verified_at')) {
                $active = $active && ! is_null($u->email_verified_at);
            }
            return [
                'id'     => $u->id,
                'name'   => $u->name,
                'email'  => $u->email,
                'active' => (bool)$active,
            ];
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $p->currentPage(),
                'last_page'    => $p->lastPage(),
                'per_page'     => $p->perPage(),
                'total'        => $p->total(),
            ],
        ]);
    }

    public function toggle(Request $r, User $user)
    {
        $changed = false;

        if (Schema::hasColumn('users','disabled')) {
            $user->disabled = (int)(! (bool)($user->disabled ?? false));
            $changed = true;
        } elseif (Schema::hasColumn('users','email_verified_at')) {
            $user->email_verified_at = $user->email_verified_at ? null : now();
            $changed = true;
        }

        if (! $changed) {
            return response()->json(['message' => 'No hay columna para activar/desactivar (disabled o email_verified_at).'], 422);
        }

        $user->save();
        return response()->noContent();
    }

    public function destroy(User $user)
    {
        // evita borrar super admin (en cualquiera de estos esquemas)
        if (
            (Schema::hasColumn('users','superadmin')   && (int)($user->superadmin ?? 0) === 1) ||
            (Schema::hasColumn('users','is_superadmin') && (int)($user->is_superadmin ?? 0) === 1) ||
            (Schema::hasColumn('users','role')          && (($user->role ?? 'user') === 'superadmin'))
        ) {
            return response()->json(['message' => 'No puedes eliminar al super admin.'], 422);
        }

        $user->delete();
        return response()->noContent();
    }

    public function bulk(Request $r)
    {
        $action = (string)$r->input('action');
        $ids    = (array)$r->input('ids', []);

        $users = User::whereIn('id', $ids)->get();

        foreach ($users as $user) {
            if ($action === 'delete') {
                if (
                    (Schema::hasColumn('users','superadmin')   && (int)($user->superadmin ?? 0) === 1) ||
                    (Schema::hasColumn('users','is_superadmin') && (int)($user->is_superadmin ?? 0) === 1) ||
                    (Schema::hasColumn('users','role')          && (($user->role ?? 'user') === 'superadmin'))
                ) {
                    continue;
                }
                $user->delete();
            } elseif (in_array($action, ['activate','deactivate'], true)) {
                if (Schema::hasColumn('users','disabled')) {
                    $user->disabled = $action === 'deactivate' ? 1 : 0;
                } elseif (Schema::hasColumn('users','email_verified_at')) {
                    $user->email_verified_at = $action === 'deactivate' ? null : ($user->email_verified_at ?: now());
                }
                $user->save();
            }
        }

        return response()->noContent();
    }

    public function export(Request $r): StreamedResponse
    {
        $ids   = $r->query('ids') ? explode(',', $r->query('ids')) : null;
        $query = User::query();
        if ($ids) $query->whereIn('id', $ids);

        if ($q = trim((string)$r->query('q', ''))) {
            $query->where(function ($x) use ($q) {
                $x->where('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $filename = 'users_'.now()->format('Ymd_His').'.csv';
        $columns  = ['id','name','email'];
        if (Schema::hasColumn('users','email_verified_at')) $columns[] = 'email_verified_at';
        if (Schema::hasColumn('users','created_at'))        $columns[] = 'created_at';

        $callback = function () use ($query, $columns) {
            $FH = fopen('php://output', 'w');
            fputcsv($FH, $columns);
            $query->chunk(500, function ($chunk) use ($FH, $columns) {
                foreach ($chunk as $u) {
                    $row = [];
                    foreach ($columns as $c) $row[] = $u->{$c};
                    fputcsv($FH, $row);
                }
            });
            fclose($FH);
        };

        return response()->streamDownload($callback, $filename, ['Content-Type' => 'text/csv']);
    }
}
