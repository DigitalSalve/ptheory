---
name: dart
description: |
  Writes idiomatic Dart with null safety, async patterns, and package conventions.
  Use when: writing or modifying Dart files, creating models from JSON APIs,
  handling async/await, working with null-safe types, adding providers,
  or structuring Flutter widgets.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Dart Skill

Write sound null-safe Dart following Flutter conventions. Discover project specifics by reading pubspec.yaml and lib/ structure before writing code.

## Before Writing Code

1. Read `pubspec.yaml` to determine SDK version, dependencies, and state management
2. Read `lib/` structure to understand project layout
3. Check for existing patterns (singletons, providers, models) and follow them

## Conventions

- **Files:** snake_case (`user_profile.dart`, `api_service.dart`)
- **Classes/Widgets:** PascalCase (`UserProfile`, `ApiService`)
- **Functions/Variables:** camelCase (`loadSession`, `apiBaseUrl`)
- **Private members:** underscore prefix (`_loading`, `_user`, `_check()`)
- **Constants:** `const` where possible, camelCase for local, SCREAMING_SNAKE for global
- **Imports:** Dart SDK first, then packages, then project-relative imports

## Key Patterns

### Defensive JSON Model

```dart
class Item {
  Item({required this.id, required this.name, this.description});

  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
    );
  }

  final String id;
  final String name;
  final String? description;
}
```

- Always use `as Type? ?? default` for required fields
- Use `as Type?` for optional fields (no default)
- Parse nested objects: `json['nested'] is Map<String, dynamic> ? Nested.fromJson(json['nested']) : null`
- Parse lists: `(json['items'] as List<dynamic>?)?.map((e) => Item.fromJson(e as Map<String, dynamic>)).toList() ?? []`

### Async Data Loading (StatefulWidget)

```dart
Future<void> _load() async {
  setState(() => _loading = true);
  try {
    final data = await someAsyncCall();
    if (!mounted) return;
    setState(() { _data = data; _loading = false; });
  } catch (e) {
    if (mounted) setState(() { _error = e.toString(); _loading = false; });
  }
}
```

- Always check `mounted` before `setState` in async callbacks
- Set `_loading = true` before the call, `false` after (in both success and error)

### Null Safety

| Pattern | When |
|---------|------|
| `String? county` | Field may be absent |
| `json['x'] as String? ?? ''` | Required field with safe default |
| `value?.toString() ?? 'N/A'` | Display nullable value |
| `if (list?.isNotEmpty == true)` | Guard before rendering a list |
| `collection if` | `if (name != null) 'name': name` in map literals |

### Error Handling

```dart
try {
  await apiCall();
} on SpecificException catch (e) {
  // Handle known errors
} catch (e) {
  // Fallback for unexpected errors
  debugPrint('Unexpected: $e');
}
```

### Platform-Conditional Imports

```dart
import 'native_impl.dart'
    if (dart.library.html) 'web_impl.dart' as platform;
```

Never import `dart:io` or `dart:html` directly in cross-platform code.

## Anti-Patterns

- Do NOT use `dynamic` when a type is known
- Do NOT skip `mounted` checks in async `setState`
- Do NOT parse JSON without null coalescing (`as String` will crash on null)
- Do NOT use `late` unless the value is guaranteed to be set before access
- Do NOT hardcode URLs, keys, or config — use environment/config patterns
