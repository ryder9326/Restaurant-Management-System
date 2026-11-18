package restaurant.common.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import restaurant.common.entity.IdSequence;

import java.util.Optional;

/** Loads sequence counters and locks their rows while {@code CodeGeneratorService} allocates identifiers. */
public interface IdSequenceRepository extends JpaRepository<IdSequence, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select sequence from IdSequence sequence where sequence.prefix = :prefix")
    Optional<IdSequence> findByPrefixForUpdate(@Param("prefix") String prefix);
}
