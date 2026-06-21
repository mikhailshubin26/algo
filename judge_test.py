import json

import requests

src = """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        System.out.println(a + b);
        scanner.close();
    }
}"""

r = requests.post(
    "http://judge0-server:2358/submissions?base64_encoded=false&wait=true",
    json={"source_code": src, "language_id": 62, "stdin": "2 3"},
    timeout=30,
)
print(r.status_code)
print(json.dumps(r.json(), indent=2, ensure_ascii=False))
