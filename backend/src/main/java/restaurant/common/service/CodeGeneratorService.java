package restaurant.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import restaurant.common.entity.IdSequence;
import restaurant.common.exception.AppException;
import restaurant.common.exception.ErrorCode;
import restaurant.common.repository.IdSequenceRepository;

/** Allocates sequential business codes using database row locks and the counters maintained in {@code id_sequences}. */
@Service
@RequiredArgsConstructor
public class CodeGeneratorService {

    private final IdSequenceRepository idSequenceRepository;

    /** Locks the counter for a prefix, increments it transactionally, and returns its zero-padded code. */
    @Transactional
    public String generateCode(String prefix) {
        IdSequence sequence = idSequenceRepository.findByPrefixForUpdate(prefix)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION,
                        "Chưa cấu hình bộ sinh mã cho tiền tố " + prefix));
        long nextValue = sequence.getCurrentValue() + 1;
        sequence.setCurrentValue(nextValue);
        idSequenceRepository.save(sequence);
        return prefix + String.format("%0" + sequence.getPadLength() + "d", nextValue);
    }
}
