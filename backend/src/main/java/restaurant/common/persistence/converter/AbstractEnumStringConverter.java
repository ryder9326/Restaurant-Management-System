package restaurant.common.persistence.converter;

import jakarta.persistence.AttributeConverter;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Provides bidirectional conversion between an application enum and its persisted database label. */
public abstract class AbstractEnumStringConverter<E extends Enum<E>> implements AttributeConverter<E, String> {

    private final Map<E, String> toDatabase;
    private final Map<String, E> fromDatabase;

    protected AbstractEnumStringConverter(Map<E, String> values) {
        this.toDatabase = Map.copyOf(values);
        this.fromDatabase = values.entrySet().stream()
                .collect(Collectors.toUnmodifiableMap(Map.Entry::getValue, Map.Entry::getKey));
    }

    @Override
    public String convertToDatabaseColumn(E value) {
        return value == null ? null : toDatabase.get(value);
    }

    @Override
    public E convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }
        E converted = fromDatabase.get(value);
        if (converted == null) {
            throw new IllegalArgumentException("Giá trị trạng thái không được hỗ trợ trong cơ sở dữ liệu: " + value);
        }
        return converted;
    }
}
