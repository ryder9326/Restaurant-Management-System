package restaurant.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Maps a code prefix to its persisted counter, shared by {@code CodeGeneratorService} for safe ID allocation. */
@Entity
@Table(name = "id_sequences")
@Getter
@Setter
@NoArgsConstructor
public class IdSequence {

    @Id
    @Column(name = "prefix", length = 10, nullable = false)
    private String prefix;

    @Column(name = "current_val", nullable = false)
    private long currentValue;

    @Column(name = "pad_length", nullable = false)
    private int padLength;
}
