---
name: flutter
description: |
  Builds Flutter widgets, screens, and platform-specific features for mobile and web.
  Use when: creating or editing screens, adding widgets, modifying navigation,
  working with theme/styling, building forms, handling platform-conditional code,
  or wiring UI to API calls.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Flutter Skill

Build Flutter screens and widgets following project conventions. Discover project specifics by reading the codebase before writing code.

## Before Writing Code

1. Read `pubspec.yaml` for Flutter version, dependencies, state management
2. Read `lib/` structure — understand screen organization, services, routing
3. Check for existing theme, guards, shell/scaffold patterns and follow them
4. Check `lib/router/` for routing setup (GoRouter, auto_route, Navigator 2.0)

## Conventions

- **Screen files:** snake_case with descriptive prefix (`app_home_screen.dart`)
- **Widget files:** snake_case (`favorite_button.dart`, `auth_guard.dart`)
- **Screen classes:** PascalCase matching file (`AppHomeScreen`, `FavoriteButton`)
- **Admin screens:** separate directory (`lib/screens/app/admin/`)

## Key Patterns

### New Screen

```dart
import 'package:flutter/material.dart';

class ExampleScreen extends StatelessWidget {
  const ExampleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Example')),
      body: const Center(child: Text('Content')),
    );
  }
}
```

Register in router. Wrap with auth guards if the project uses them.

### Async Data Screen (StatefulWidget)

```dart
class DataScreen extends StatefulWidget {
  const DataScreen({super.key});

  @override
  State<DataScreen> createState() => _DataScreenState();
}

class _DataScreenState extends State<DataScreen> {
  bool _loading = true;
  String? _error;
  List<Item> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await fetchItems();
      if (!mounted) return;
      setState(() { _items = items; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text('Error: $_error'));
    if (_items.isEmpty) return const Center(child: Text('No items'));
    return ListView.builder(
      itemCount: _items.length,
      itemBuilder: (context, i) => ListTile(title: Text(_items[i].name)),
    );
  }
}
```

### Back Button Pattern

```dart
leading: IconButton(
  icon: const Icon(Icons.arrow_back),
  onPressed: () {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home'); // fallback when no stack
    }
  },
),
```

### Form with Validation

```dart
final _formKey = GlobalKey<FormState>();

Form(
  key: _formKey,
  child: Column(children: [
    TextFormField(
      validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
    ),
    ElevatedButton(
      onPressed: () {
        if (_formKey.currentState!.validate()) {
          // submit
        }
      },
      child: const Text('Submit'),
    ),
  ]),
)
```

### Null-Safe Conditional Rendering

```dart
// Show section only when data exists
if (items?.isNotEmpty == true) ...[
  const SizedBox(height: 16),
  _buildItemsSection(items!),
],

// Ternary for simple cases
profile?.photoUrl != null
    ? CircleAvatar(backgroundImage: NetworkImage(profile!.photoUrl!))
    : const CircleAvatar(child: Icon(Icons.person)),
```

### Theme Usage

```dart
// Always use the project theme — discover it first
final theme = Theme.of(context);
Text('Title', style: theme.textTheme.headlineSmall);
Container(color: theme.colorScheme.primary);
```

### Platform Checks

```dart
import 'package:flutter/foundation.dart' show kIsWeb;

if (kIsWeb) {
  // web-specific code
} else {
  // mobile-specific code
}
```

## Anti-Patterns

- Do NOT hardcode colors — use the project theme
- Do NOT skip `mounted` checks in async callbacks
- Do NOT use `context.go()` for back navigation — use `context.pop()` with `canPop()` fallback
- Do NOT render sections unconditionally — always null-check optional data
- Do NOT use `SizedBox` with fixed height for scrollable content — use `Expanded` or `Flexible`
- Do NOT import `dart:io` or `dart:html` directly — use conditional imports
