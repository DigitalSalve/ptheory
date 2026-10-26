# Policy: Flutter + Dart Codebase

Enforced by `/implement` when `context.codebase` includes `flutter-dart`.

## Screen Pattern

```dart
class AppFeatureScreen extends StatelessWidget {
  const AppFeatureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Feature')),
      body: const Center(child: Text('Content')),
    );
  }
}
```

## MUST Rules

- Use `const` constructors wherever possible
- Use theme constants (`AppTheme.primaryColor`) — never hardcode hex values in screens
- Material 3 with `useMaterial3: true`
- `surfaceTintColor: Colors.transparent` on surfaces to prevent Material 3 tinting
- Adaptive layout — must work on mobile viewports AND desktop browser
- Consistent spacing with 8/12/16/24 increments
- Wrap auth-required screens in `AuthGuard`
- Use `SharedPreferences.setMockInitialValues({})` in test `setUp`

## Route Registration (GoRouter)

```dart
GoRoute(
  path: '/feature',
  builder: (context, state) => AuthGuard(child: const AppFeatureScreen()),
),
```

## Async Data (Riverpod)

```dart
final featureProvider = FutureProvider.family<Data, String>((ref, id) async {
  return apiService.getFeature(id);
});
```

## State Management

- Use Riverpod for server and client state
- `FutureProvider` for async data fetching
- `StateNotifier` / `Notifier` for mutable state
- Use `select()` to minimize rebuilds — don't subscribe to entire objects when you need one field

## Platform Safety

Never import `dart:io` or `dart:html` directly:
```dart
import 'native_impl.dart'
    if (dart.library.html) 'web_impl.dart' as platform;
```

## Error Handling

```dart
catch (e) {
  final msg = dioErrorMessage(e, 'Something went wrong');
}
```

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | snake_case | `app_home_screen.dart` |
| Screens | `app_` + feature + `_screen.dart` | `app_candidate_detail_screen.dart` |
| Admin screens | `app_admin_` prefix | `app_admin_polls_screen.dart` |
| Classes/widgets | PascalCase | `AppHomeScreen` |
| Functions/variables | camelCase | `loadSession()` |
| Private members | `_` prefix | `_selectedIndex` |
| Constants | camelCase or SCREAMING_SNAKE | `apiBaseUrl` |

## Import Order

1. Dart/Flutter SDK (`package:flutter/material.dart`)
2. External packages (`package:flutter_riverpod`, `package:go_router`)
3. Internal project imports (relative paths)

## Auth State Policy

- Session check: `authState.hasSession` — never `apiService.hasSession`
- Set session: `authState.setSession(token, refreshToken: res.refreshToken)`
- Clear session: `authState.clearSession()`
- Router uses `authState` as `refreshListenable`

## Widget Testing

```dart
testWidgets('description', (tester) async {
  SharedPreferences.setMockInitialValues({});
  await tester.pumpWidget(
    ProviderScope(child: MaterialApp(home: const MyWidget())),
  );
  await tester.pumpAndSettle();
  expect(find.text('Expected'), findsOneWidget);
});
```

## MUST NOT Rules

- Do not import `dart:io` or `dart:html` without conditional handling
- Do not hardcode hex color values in screen files
- Do not use `apiService` for session checks — use `authState`
- Do not scatter `SharedPreferences` calls — use the storage service
