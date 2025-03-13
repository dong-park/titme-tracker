// utils/classNames.ts

/**
 * 여러 클래스 이름을 조합하여 하나의 문자열로 반환합니다.
 * @param classes 클래스 이름 배열 또는 객체 (객체의 경우 값이 truthy일 때만 키가 포함됨)
 * @returns 공백으로 구분된 클래스 이름 문자열
 */
export function classNames(...classes: (string | Record<string, boolean> | null | undefined | false)[]): string {
    const result: string[] = [];

    classes.forEach(cls => {
        if (!cls) return;

        if (typeof cls === 'string') {
            result.push(cls);
        } else if (typeof cls === 'object') {
            Object.entries(cls).forEach(([key, value]) => {
                if (value) {
                    result.push(key);
                }
            });
        }
    });

    return result.join(' ');
}
